import type Stripe from "stripe";
import type { WorkspaceLifecycleState } from "@/lib/types";

const DELETION_BLOCKING_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

const ENTITLEMENT_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

export type SubscriptionLifecycleAction =
  | "apply"
  | "cancel"
  | "ignore"
  | "retry";

export function isDeletionBlockingStatus(status: Stripe.Subscription.Status) {
  return DELETION_BLOCKING_STATUSES.has(status);
}

export function isEntitlementStatus(status: Stripe.Subscription.Status) {
  return ENTITLEMENT_STATUSES.has(status);
}

export function subscriptionLifecycleAction(
  lifecycleState: WorkspaceLifecycleState,
  status: Stripe.Subscription.Status,
): SubscriptionLifecycleAction {
  if (lifecycleState === "deleting") {
    return isDeletionBlockingStatus(status) ? "cancel" : "ignore";
  }
  if (lifecycleState === "billing") return "retry";
  return "apply";
}

export function mismatchedSubscriptionAction(
  currentSubscriptionId: string | null,
  incomingSubscriptionId: string,
  incomingStatus: Stripe.Subscription.Status,
): "continue" | "cancel" | "ignore" {
  if (!currentSubscriptionId || currentSubscriptionId === incomingSubscriptionId) {
    return "continue";
  }
  return isEntitlementStatus(incomingStatus) ? "cancel" : "ignore";
}
