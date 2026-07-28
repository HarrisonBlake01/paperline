import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, isAdmin } from "@/lib/auth/workspace";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/server";
import type { Workspace } from "@/lib/types";
import {
  checkoutCustomerIdempotencyKey,
  checkoutCustomerParams,
  checkoutSessionIdempotencyKey,
  checkoutSessionParams,
} from "@/lib/billing/checkout-operation";
import { hasBlockingStripeSubscription } from "@/lib/billing/stripe-subscriptions";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["pro", "team"]),
  operationId: z.string().uuid(),
});

async function claimBillingOperation(
  sb: ReturnType<typeof createServiceClient>,
  workspace: Workspace,
  operationId: string,
  planId: PlanId,
) {
  const { data: claimed, error } = await sb.rpc("claim_workspace_billing", {
    p_workspace_id: workspace.id,
    p_operation_token: operationId,
    p_requested_plan: planId,
  });
  if (error) throw error;
  return claimed === true;
}

async function releaseBillingOperation(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationId: string,
) {
  const { data, error } = await sb.rpc("release_workspace_billing", {
    p_workspace_id: workspaceId,
    p_operation_token: operationId,
  });
  if (error) throw error;
  return data === true;
}

async function parseBody(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return Body.safeParse(await req.json().catch(() => ({})));
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return Body.safeParse({
      plan: form.get("plan"),
      operationId: form.get("operationId"),
    });
  }
  return Body.safeParse({});
}

function wantsJson(req: Request) {
  return (req.headers.get("accept") || "").includes("application/json")
    || (req.headers.get("content-type") || "").includes("application/json");
}

function isStripeResourceMissing(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "resource_missing",
  );
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace(undefined, { allowNonActive: true });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (ctx.workspace.lifecycle_state === "deleting") {
    return NextResponse.json(
      { error: "workspace_operation_in_progress" },
      { status: 409 },
    );
  }

  const body = await parseBody(req);
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const planId = body.data.plan as PlanId;
  const operationId = body.data.operationId;
  const plan = PLANS[planId];
  const priceEnv = plan.stripePriceEnv;
  const priceId = priceEnv ? process.env[priceEnv] : undefined;
  if (!priceId) {
    return NextResponse.json(
      { error: "missing_price_id", env: priceEnv },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const sb = createServiceClient();
  const claimed = await claimBillingOperation(
    sb,
    ctx.workspace,
    operationId,
    planId,
  );
  if (!claimed) {
    return NextResponse.json(
      { error: "workspace_operation_in_progress" },
      { status: 409 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const { data: operation, error: operationError } = await sb
      .from("workspace_billing_operations")
      .select("status,stripe_session_id")
      .eq("id", operationId)
      .eq("workspace_id", ctx.workspace.id)
      .eq("requested_plan", planId)
      .maybeSingle();
    if (operationError || !operation) {
      throw operationError ?? new Error("billing_operation_missing");
    }

    if (operation.status === "open" && operation.stripe_session_id) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        operation.stripe_session_id,
      );
      if (existingSession.status === "open" && existingSession.url) {
        if (wantsJson(req)) {
          return NextResponse.json({ url: existingSession.url });
        }
        return NextResponse.redirect(existingSession.url, 303);
      }

      const terminalStatus = existingSession.status === "complete"
        ? "completed"
        : "expired";
      await sb
        .from("workspace_billing_operations")
        .update({ status: terminalStatus, updated_at: new Date().toISOString() })
        .eq("id", operationId)
        .eq("workspace_id", ctx.workspace.id)
        .eq("status", "open");
      return NextResponse.json(
        { error: "checkout_operation_expired" },
        { status: 409 },
      );
    }

    if (ctx.workspace.stripe_subscription_id && !ctx.workspace.stripe_customer_id) {
      return NextResponse.json(
        { error: "existing_subscription_requires_reconciliation" },
        { status: 409 },
      );
    }
    if (ctx.workspace.stripe_customer_id) {
      let existingSubscription: boolean;
      try {
        existingSubscription = await hasBlockingStripeSubscription(
          stripe,
          ctx.workspace.stripe_customer_id,
        );
      } catch (error) {
        if (!isStripeResourceMissing(error)) throw error;
        if (ctx.workspace.stripe_subscription_id) throw error;
        existingSubscription = false;
      }
      if (existingSubscription) {
        return NextResponse.json(
          { error: "existing_subscription" },
          { status: 409 },
        );
      }
    }

    // Both customer and Checkout Session calls use the durable application
    // operation ID. A dropped response can be replayed without duplicating the
    // provider objects.
    let customerId = ctx.workspace.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create(
        checkoutCustomerParams({
          workspaceId: ctx.workspace.id,
          workspaceName: ctx.workspace.name,
          operationId,
        }),
        {
          idempotencyKey: checkoutCustomerIdempotencyKey(
            ctx.workspace.id,
            operationId,
          ),
        },
      );
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create(
      checkoutSessionParams({
        workspaceId: ctx.workspace.id,
        operationId,
        planId,
        priceId,
        customerId,
        appUrl,
      }),
      {
        idempotencyKey: checkoutSessionIdempotencyKey(
          ctx.workspace.id,
          operationId,
        ),
      },
    );

    const { data: recorded, error: recordError } = await sb.rpc(
      "record_workspace_checkout_session",
      {
        p_workspace_id: ctx.workspace.id,
        p_operation_token: operationId,
        p_customer_id: customerId,
        p_session_id: session.id,
        p_expires_at: new Date(session.expires_at * 1000).toISOString(),
      },
    );
    if (recordError || recorded !== true) {
      throw recordError ?? new Error("billing_operation_lost");
    }
    if (!session.url) {
      throw new Error("checkout_session_url_missing");
    }

    if (wantsJson(req)) {
      return NextResponse.json({ url: session.url });
    }
    return NextResponse.redirect(session.url, 303);
  } finally {
    const released = await releaseBillingOperation(
      sb,
      ctx.workspace.id,
      operationId,
    ).catch((error: unknown) => {
      console.error("[billing.checkout] lifecycle release failed", {
        workspaceId: ctx.workspace.id,
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      return false;
    });
    if (!released) {
      console.error("[billing.checkout] lifecycle release lost ownership", {
        workspaceId: ctx.workspace.id,
      });
    }
  }
}
