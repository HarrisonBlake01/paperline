import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  isEntitlementStatus,
  mismatchedSubscriptionAction,
  subscriptionLifecycleAction,
} from "@/lib/billing/subscription-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function planLimit(plan: PlanId): number {
  const p = PLANS[plan];
  return p.pagesPerMonth === -1 ? Number.MAX_SAFE_INTEGER : p.pagesPerMonth;
}

async function markCheckoutOperation(
  workspaceId: string,
  operationId: string | undefined,
  status: "completed" | "expired" | "failed",
) {
  if (!operationId) return;
  const sb = createServiceClient();
  const { error } = await sb
    .from("workspace_billing_operations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", operationId)
    .eq("workspace_id", workspaceId)
    .in("status", ["creating", "open"]);
  if (error) throw error;
}

async function syncSubscription(
  sub: Stripe.Subscription,
  stripe: ReturnType<typeof getStripe>,
) {
  const sb = createServiceClient();
  const workspaceId = (sub.metadata?.workspace_id as string | undefined) ?? null;
  const operationId = sub.metadata?.checkout_operation_id;
  const metadataPlan = sub.metadata?.plan;
  const plan: PlanId | null =
    metadataPlan === "pro" || metadataPlan === "team" ? metadataPlan : null;
  if (!workspaceId) return;
  if (!plan) throw new Error("Subscription metadata contains an invalid plan.");

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { data: workspace, error: workspaceError } = await sb
    .from("workspaces")
    .select("id,stripe_customer_id,stripe_subscription_id,lifecycle_state")
    .eq("id", workspaceId)
    .maybeSingle();
  if (workspaceError) throw workspaceError;
  if (!workspace) return;
  if (!workspace.stripe_customer_id || workspace.stripe_customer_id !== customerId) {
    throw new Error("Subscription customer does not match the target workspace.");
  }

  const identityAction = mismatchedSubscriptionAction(
    workspace.stripe_subscription_id,
    sub.id,
    sub.status,
  );
  if (identityAction === "cancel") {
    await stripe.subscriptions.cancel(sub.id);
    await markCheckoutOperation(workspaceId, operationId, "failed");
    return;
  }
  if (identityAction === "ignore") return;

  // A completion racing owner-tokened deletion must not reactivate billing.
  // Cancel the provider subscription and acknowledge only after cancellation.
  const lifecycleAction = subscriptionLifecycleAction(
    workspace.lifecycle_state,
    sub.status,
  );
  if (lifecycleAction === "cancel" || lifecycleAction === "ignore") {
    if (lifecycleAction === "cancel") {
      await stripe.subscriptions.cancel(sub.id);
    }
    await markCheckoutOperation(workspaceId, operationId, "failed");
    return;
  }
  if (lifecycleAction === "retry") {
    // Checkout releases its short database claim in finally. A retry from Stripe
    // will apply the event after the workspace returns to active.
    throw new Error("Workspace is not active for subscription synchronization.");
  }

  const entitled = isEntitlementStatus(sub.status);
  if (!entitled && !workspace.stripe_subscription_id) {
    await markCheckoutOperation(workspaceId, operationId, "expired");
    return;
  }
  let updateQuery = sb
    .from("workspaces")
    .update({
      plan: entitled ? plan : "free",
      pages_limit: entitled ? planLimit(plan) : planLimit("free"),
      stripe_subscription_id: entitled ? sub.id : null,
    })
    .eq("id", workspaceId)
    .eq("stripe_customer_id", customerId)
    .eq("lifecycle_state", "active");
  updateQuery = entitled
    ? updateQuery.or(
        `stripe_subscription_id.is.null,stripe_subscription_id.eq.${sub.id}`,
      )
    : updateQuery.eq("stripe_subscription_id", sub.id);
  const { data: updated, error: updateError } = await updateQuery
    .select("id")
    .maybeSingle();
  if (updateError || !updated) {
    throw updateError ?? new Error("Workspace lifecycle changed during billing sync.");
  }

  await markCheckoutOperation(
    workspaceId,
    operationId,
    entitled ? "completed" : "expired",
  );
}

function isStripeResourceMissing(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "resource_missing",
  );
}

async function retrieveAuthoritativeSubscription(
  stripe: ReturnType<typeof getStripe>,
  eventSubscription: Stripe.Subscription,
) {
  try {
    return await stripe.subscriptions.retrieve(eventSubscription.id);
  } catch (error) {
    if (!isStripeResourceMissing(error)) throw error;
    return {
      ...eventSubscription,
      status: "canceled",
    } as Stripe.Subscription;
  }
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          );
          await syncSubscription(sub, stripe);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspace_id;
        if (workspaceId) {
          await markCheckoutOperation(
            workspaceId,
            session.metadata?.checkout_operation_id,
            "expired",
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = await retrieveAuthoritativeSubscription(
          stripe,
          event.data.object as Stripe.Subscription,
        );
        await syncSubscription(sub, stripe);
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        // hook for future email notifications
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("[webhooks.stripe] handler failed", {
      eventId: event.id,
      eventType: event.type,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
