// =====================================================================
// Stripe client (server-only).
// =====================================================================

import Stripe from "stripe";

let client: Stripe | null = null;

export function isStripeSecretKeyAllowed(
  key: string,
  allowLive = process.env.PAPERLINE_ALLOW_LIVE_STRIPE === "true",
): boolean {
  return key.startsWith("sk_test_") || (allowLive && key.startsWith("sk_live_"));
}

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY.");
    if (!isStripeSecretKeyAllowed(key)) {
      throw new Error(
        "Stripe secret key rejected. Use test mode or explicitly enable live Stripe.",
      );
    }
    client = new Stripe(key);
  }
  return client;
}
