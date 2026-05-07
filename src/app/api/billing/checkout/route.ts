import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, isAdmin } from "@/lib/auth/workspace";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["pro", "team"]),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const planId = body.data.plan as PlanId;
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

  // Get or create the Stripe customer for this workspace
  let customerId = ctx.workspace.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: ctx.workspace.name,
      metadata: { workspace_id: ctx.workspace.id },
    });
    customerId = customer.id;
    await sb
      .from("workspaces")
      .update({ stripe_customer_id: customerId })
      .eq("id", ctx.workspace.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?status=success`,
    cancel_url: `${appUrl}/settings/billing?status=cancelled`,
    metadata: {
      workspace_id: ctx.workspace.id,
      plan: planId,
    },
    subscription_data: {
      metadata: {
        workspace_id: ctx.workspace.id,
        plan: planId,
      },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
