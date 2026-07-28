import type Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

export function checkoutCustomerIdempotencyKey(
  workspaceId: string,
  operationId: string,
) {
  return `customer:${workspaceId}:${operationId}`;
}

export function checkoutSessionIdempotencyKey(
  workspaceId: string,
  operationId: string,
) {
  return `checkout:${workspaceId}:${operationId}`;
}

export function checkoutCustomerParams(input: {
  workspaceId: string;
  workspaceName: string;
  operationId: string;
}): Stripe.CustomerCreateParams {
  return {
    name: input.workspaceName,
    metadata: {
      workspace_id: input.workspaceId,
      checkout_operation_id: input.operationId,
    },
  };
}

export function checkoutSessionParams(input: {
  workspaceId: string;
  operationId: string;
  planId: PlanId;
  priceId: string;
  customerId: string;
  appUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  return {
    mode: "subscription",
    customer: input.customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${input.appUrl}/settings/billing?status=success`,
    cancel_url: `${input.appUrl}/settings/billing?status=cancelled`,
    metadata: {
      workspace_id: input.workspaceId,
      plan: input.planId,
      checkout_operation_id: input.operationId,
    },
    subscription_data: {
      metadata: {
        workspace_id: input.workspaceId,
        plan: input.planId,
        checkout_operation_id: input.operationId,
      },
    },
    allow_promotion_codes: true,
  };
}
