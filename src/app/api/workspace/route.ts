import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { Workspace } from "@/lib/types";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  checkoutCustomerIdempotencyKey,
  checkoutCustomerParams,
  checkoutSessionIdempotencyKey,
  checkoutSessionParams,
} from "@/lib/billing/checkout-operation";
import { hasBlockingStripeSubscription } from "@/lib/billing/stripe-subscriptions";

export const runtime = "nodejs";

const DeleteWorkspaceBody = z.object({
  workspaceId: z.string().uuid(),
  confirmation: z.string().min(1).max(200),
  operationToken: z.string().uuid(),
});

const STORAGE_LIST_PAGE_SIZE = 1000;
const STORAGE_REMOVE_BATCH_SIZE = 100;
const MAX_WORKSPACE_OBJECTS = 10_000;

function stripeErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "StripeError";
}

async function claimWorkspaceDeletion(
  sb: ReturnType<typeof createServiceClient>,
  workspace: Workspace,
  operationToken: string,
) {
  const { data, error } = await sb.rpc("claim_workspace_deletion", {
    p_workspace_id: workspace.id,
    p_operation_token: operationToken,
  });
  if (error) throw error;
  return data === true;
}

async function releaseWorkspaceDeletion(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationToken: string,
) {
  const { data, error } = await sb.rpc("release_workspace_deletion", {
    p_workspace_id: workspaceId,
    p_operation_token: operationToken,
  });
  if (error) throw error;
  return data === true;
}

async function renewWorkspaceDeletion(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationToken: string,
) {
  const { data, error } = await sb.rpc("renew_workspace_deletion", {
    p_workspace_id: workspaceId,
    p_operation_token: operationToken,
  });
  if (error) throw error;
  return data === true;
}

async function beginDestructiveWorkspaceDeletion(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationToken: string,
) {
  const { data, error } = await sb.rpc("begin_workspace_destructive_deletion", {
    p_workspace_id: workspaceId,
    p_operation_token: operationToken,
  });
  if (error) throw error;
  return data === true;
}

async function assertWorkspaceDeletionOwner(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationToken: string,
) {
  if (!(await renewWorkspaceDeletion(sb, workspaceId, operationToken))) {
    throw new Error("workspace_deletion_claim_lost");
  }
}

async function pauseWorkspaceDeletion(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationToken: string,
) {
  const { data, error } = await sb.rpc("pause_workspace_deletion", {
    p_workspace_id: workspaceId,
    p_operation_token: operationToken,
  });
  if (error) throw error;
  return data === true;
}

async function listWorkspaceStorageObjects(
  sb: ReturnType<typeof createServiceClient>,
  bucket: string,
  workspaceId: string,
) {
  const objectPaths: string[] = [];
  const pendingPrefixes = [workspaceId];

  while (pendingPrefixes.length) {
    const prefix = pendingPrefixes.pop()!;
    let offset = 0;

    while (true) {
      const { data, error } = await sb.storage.from(bucket).list(prefix, {
        limit: STORAGE_LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;

      const entries = data ?? [];
      for (const entry of entries) {
        const path = `${prefix}/${entry.name}`;
        if (entry.id === null) {
          pendingPrefixes.push(path);
        } else {
          objectPaths.push(path);
          if (objectPaths.length > MAX_WORKSPACE_OBJECTS) {
            throw new Error("workspace_storage_limit_exceeded");
          }
        }
      }

      if (entries.length < STORAGE_LIST_PAGE_SIZE) break;
      offset += entries.length;
    }
  }

  return objectPaths;
}

async function pauseAfterPartialFailure(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  operationToken: string,
) {
  await pauseWorkspaceDeletion(sb, workspaceId, operationToken).catch(() => undefined);
}

async function reconcilePendingCheckoutsForDeletion(
  sb: ReturnType<typeof createServiceClient>,
  stripe: ReturnType<typeof getStripe>,
  workspace: Workspace,
  deletionToken: string,
) {
  const { data: pendingOperations, error } = await sb
    .from("workspace_billing_operations")
    .select("id,requested_plan,stripe_customer_id,stripe_session_id")
    .eq("workspace_id", workspace.id)
    .in("status", ["creating", "open"]);
  if (error) throw error;

  let workspaceCustomerId = workspace.stripe_customer_id;
  for (const operation of pendingOperations ?? []) {
    await assertWorkspaceDeletionOwner(sb, workspace.id, deletionToken);
    const planId = operation.requested_plan as PlanId;
    if (planId !== "pro" && planId !== "team") {
      throw new Error("invalid_pending_checkout_plan");
    }
    const priceEnv = PLANS[planId].stripePriceEnv;
    const priceId = priceEnv ? process.env[priceEnv] : undefined;
    if (!priceId) throw new Error("pending_checkout_price_missing");

    let customerId = operation.stripe_customer_id ?? workspaceCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create(
        checkoutCustomerParams({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          operationId: operation.id,
        }),
        {
          idempotencyKey: checkoutCustomerIdempotencyKey(
            workspace.id,
            operation.id,
          ),
        },
      );
      customerId = customer.id;
    }

    const { data: customerRecorded, error: customerRecordError } = await sb
      .from("workspaces")
      .update({ stripe_customer_id: customerId })
      .eq("id", workspace.id)
      .eq("lifecycle_state", "deleting")
      .eq("lifecycle_operation_token", deletionToken)
      .or(`stripe_customer_id.is.null,stripe_customer_id.eq.${customerId}`)
      .select("id")
      .maybeSingle();
    if (customerRecordError || !customerRecorded) {
      throw customerRecordError ?? new Error("pending_checkout_customer_conflict");
    }
    workspaceCustomerId = customerId;

    let session;
    if (operation.stripe_session_id) {
      try {
        session = await stripe.checkout.sessions.retrieve(
          operation.stripe_session_id,
        );
      } catch (error) {
        if (stripeErrorCode(error) !== "resource_missing") throw error;
        const { error: missingSessionUpdateError } = await sb
          .from("workspace_billing_operations")
          .update({
            status: "expired",
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", operation.id)
          .eq("workspace_id", workspace.id)
          .in("status", ["creating", "open"]);
        if (missingSessionUpdateError) throw missingSessionUpdateError;
        continue;
      }
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      session = await stripe.checkout.sessions.create(
        checkoutSessionParams({
          workspaceId: workspace.id,
          operationId: operation.id,
          planId,
          priceId,
          customerId,
          appUrl,
        }),
        {
          idempotencyKey: checkoutSessionIdempotencyKey(
            workspace.id,
            operation.id,
          ),
        },
      );
    }

    let nextStatus: "expired" | "completed";
    if (session.status === "open") {
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (error) {
        if (stripeErrorCode(error) !== "resource_missing") throw error;
      }
      nextStatus = "expired";
    } else if (session.status === "complete") {
      nextStatus = "completed";
    } else {
      nextStatus = "expired";
    }

    const { error: operationUpdateError } = await sb
      .from("workspace_billing_operations")
      .update({
        status: nextStatus,
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", operation.id)
      .eq("workspace_id", workspace.id)
      .in("status", ["creating", "open"]);
    if (operationUpdateError) throw operationUpdateError;
  }

  return workspaceCustomerId;
}

export async function DELETE(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace(undefined, { allowNonActive: true });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  if (ctx.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const body = DeleteWorkspaceBody.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (
    body.data.workspaceId !== ctx.workspace.id ||
    body.data.confirmation !== ctx.workspace.name
  ) {
    return NextResponse.json(
      { error: "workspace_confirmation_mismatch" },
      { status: 400 },
    );
  }

  const sb = createServiceClient();
  const bucket = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
  const operationToken = body.data.operationToken;
  let claimed: boolean;
  try {
    claimed = await claimWorkspaceDeletion(sb, ctx.workspace, operationToken);
  } catch (error) {
    console.error("[workspace.delete] lifecycle claim failed", {
      workspaceId: ctx.workspace.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "workspace_delete_unavailable" },
      { status: 503 },
    );
  }
  if (!claimed) {
    return NextResponse.json(
      { error: "workspace_operation_in_progress" },
      { status: 409 },
    );
  }

  const { data: workspace, error: workspaceError } = await sb
    .from("workspaces")
    .select("*")
    .eq("id", ctx.workspace.id)
    .eq("lifecycle_state", "deleting")
    .eq("lifecycle_operation_token", operationToken)
    .maybeSingle();
  if (workspaceError || !workspace) {
    await pauseAfterPartialFailure(sb, ctx.workspace.id, operationToken);
    return NextResponse.json(
      { error: "workspace_delete_unavailable" },
      { status: 503 },
    );
  }

  let stripe: ReturnType<typeof getStripe> | null = null;
  let stripeCustomerId = workspace.stripe_customer_id as string | null;
  let hasActiveSubscription = Boolean(
    workspace.stripe_subscription_id && !workspace.stripe_customer_id,
  );
  try {
    const { count: pendingCheckoutCount, error: pendingCheckoutCountError } = await sb
      .from("workspace_billing_operations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .in("status", ["creating", "open"]);
    if (pendingCheckoutCountError) throw pendingCheckoutCountError;

    if (stripeCustomerId || (pendingCheckoutCount ?? 0) > 0) {
      stripe = getStripe();
      stripeCustomerId = await reconcilePendingCheckoutsForDeletion(
        sb,
        stripe,
        workspace as Workspace,
        operationToken,
      );

      if (stripeCustomerId) {
        await assertWorkspaceDeletionOwner(
          sb,
          ctx.workspace.id,
          operationToken,
        );
        try {
          hasActiveSubscription = await hasBlockingStripeSubscription(
            stripe,
            stripeCustomerId,
          );
        } catch (error) {
          if (stripeErrorCode(error) !== "resource_missing") throw error;
          hasActiveSubscription = false;
        }
        await assertWorkspaceDeletionOwner(
          sb,
          ctx.workspace.id,
          operationToken,
        );
      }
    }
  } catch (error) {
    console.error("[workspace.delete] billing verification failed", {
      workspaceId: ctx.workspace.id,
      providerCode: stripeErrorCode(error),
    });
    await pauseAfterPartialFailure(sb, ctx.workspace.id, operationToken);
    return NextResponse.json(
      { error: "workspace_delete_unavailable" },
      { status: 503 },
    );
  }
  if (hasActiveSubscription) {
    await releaseWorkspaceDeletion(sb, ctx.workspace.id, operationToken);
    return NextResponse.json(
      {
        error: "active_subscription",
        detail: "Cancel the active subscription before deleting this workspace.",
      },
      { status: 409 },
    );
  }

  let objectPaths: string[];
  try {
    objectPaths = await listWorkspaceStorageObjects(
      sb,
      bucket,
      ctx.workspace.id,
    );
  } catch (error) {
    await releaseWorkspaceDeletion(sb, ctx.workspace.id, operationToken);
    console.error("[workspace.delete] storage enumeration failed", {
      workspaceId: ctx.workspace.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
      storageLimitExceeded:
        error instanceof Error &&
        error.message === "workspace_storage_limit_exceeded",
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          error.message === "workspace_storage_limit_exceeded"
            ? "workspace_too_large_for_self_service_deletion"
            : "workspace_delete_unavailable",
      },
      { status: error instanceof Error && error.message === "workspace_storage_limit_exceeded" ? 409 : 503 },
    );
  }

  try {
    if (
      !(await beginDestructiveWorkspaceDeletion(
        sb,
        ctx.workspace.id,
        operationToken,
      ))
    ) {
      return NextResponse.json(
        { error: "workspace_operation_in_progress" },
        { status: 409 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "workspace_delete_unavailable" },
      { status: 503 },
    );
  }

  for (let index = 0; index < objectPaths.length; index += STORAGE_REMOVE_BATCH_SIZE) {
    try {
      await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    } catch {
      return NextResponse.json(
        { error: "workspace_operation_in_progress" },
        { status: 409 },
      );
    }
    const batch = objectPaths.slice(index, index + STORAGE_REMOVE_BATCH_SIZE);
    const { error } = await sb.storage.from(bucket).remove(batch);
    try {
      await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    } catch {
      return NextResponse.json(
        { error: "workspace_operation_in_progress" },
        { status: 409 },
      );
    }
    if (error) {
      console.error("[workspace.delete] storage removal failed", {
        workspaceId: ctx.workspace.id,
        objectCount: objectPaths.length,
        failedBatchIndex: Math.floor(index / STORAGE_REMOVE_BATCH_SIZE),
        providerCode: error.name,
      });
      await pauseAfterPartialFailure(sb, ctx.workspace.id, operationToken);
      return NextResponse.json(
        { error: "workspace_delete_unavailable" },
        { status: 503 },
      );
    }
  }

  // Once deletion is claimed no new upload lease can begin. Re-scan after the
  // initial cleanup to catch objects from an expired or crashed upload lease.
  try {
    await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    const remainingPaths = await listWorkspaceStorageObjects(
      sb,
      bucket,
      ctx.workspace.id,
    );
    await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    for (
      let index = 0;
      index < remainingPaths.length;
      index += STORAGE_REMOVE_BATCH_SIZE
    ) {
      await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
      const batch = remainingPaths.slice(
        index,
        index + STORAGE_REMOVE_BATCH_SIZE,
      );
      const { error } = await sb.storage.from(bucket).remove(batch);
      await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
      if (error) throw error;
    }
    await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    const finalPaths = await listWorkspaceStorageObjects(
      sb,
      bucket,
      ctx.workspace.id,
    );
    await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    if (finalPaths.length) throw new Error("workspace_storage_not_empty");
  } catch (error) {
    console.error("[workspace.delete] final storage verification failed", {
      workspaceId: ctx.workspace.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    await pauseAfterPartialFailure(sb, ctx.workspace.id, operationToken);
    return NextResponse.json(
      { error: "workspace_delete_unavailable" },
      { status: 503 },
    );
  }

  if (stripeCustomerId) {
    try {
      await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
      await stripe!.customers.del(stripeCustomerId);
      await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
    } catch (error) {
      const providerCode = stripeErrorCode(error);
      if (providerCode !== "resource_missing") {
        console.error("[workspace.delete] billing customer removal failed", {
          workspaceId: ctx.workspace.id,
          providerCode,
        });
        await pauseAfterPartialFailure(sb, ctx.workspace.id, operationToken);
        return NextResponse.json(
          { error: "workspace_delete_unavailable" },
          { status: 503 },
        );
      }
    }
  }

  try {
    await assertWorkspaceDeletionOwner(sb, ctx.workspace.id, operationToken);
  } catch {
    return NextResponse.json(
      { error: "workspace_operation_in_progress" },
      { status: 409 },
    );
  }
  const { data: deleted, error: deleteError } = await sb.rpc(
    "delete_claimed_workspace",
    {
      p_workspace_id: ctx.workspace.id,
      p_operation_token: operationToken,
    },
  );
  if (deleteError || deleted !== true) {
    console.error("[workspace.delete] database removal failed", {
      workspaceId: ctx.workspace.id,
      errorType: deleteError?.code ?? "WorkspaceNotFound",
    });
    await pauseAfterPartialFailure(sb, ctx.workspace.id, operationToken);
    return NextResponse.json(
      { error: "workspace_delete_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
