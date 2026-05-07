import { NextResponse } from "next/server";
import { requireWorkspace, isAdmin } from "@/lib/auth/workspace";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
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
  if (!ctx.workspace.stripe_customer_id) {
    return NextResponse.json({ error: "no_stripe_customer" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: ctx.workspace.stripe_customer_id,
    return_url: `${appUrl}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
