import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function planLimit(plan: PlanId): number {
  const p = PLANS[plan];
  return p.pagesPerMonth === -1 ? Number.MAX_SAFE_INTEGER : p.pagesPerMonth;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const sb = createServiceClient();
  const workspaceId = (sub.metadata?.workspace_id as string | undefined) ?? null;
  const plan = (sub.metadata?.plan as PlanId | undefined) ?? "pro";
  if (!workspaceId) return;

  const active =
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due";

  await sb
    .from("workspaces")
    .update({
      plan: active ? plan : "free",
      pages_limit: active ? planLimit(plan) : planLimit("free"),
      stripe_subscription_id: sub.id,
    })
    .eq("id", workspaceId);
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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "invalid_signature", detail: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        // hook for future email notifications
        break;
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "handler_failed", detail: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
