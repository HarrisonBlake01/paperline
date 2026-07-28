import type Stripe from "stripe";
import { isDeletionBlockingStatus } from "@/lib/billing/subscription-lifecycle";

export async function hasBlockingStripeSubscription(
  stripe: Stripe,
  customerId: string,
) {
  let startingAfter: string | undefined;
  do {
    const page = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    if (page.data.some((subscription) => isDeletionBlockingStatus(subscription.status))) {
      return true;
    }
    if (!page.has_more || page.data.length === 0) return false;
    startingAfter = page.data.at(-1)!.id;
  } while (startingAfter);
  return false;
}
