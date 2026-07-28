import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  checkoutCustomerIdempotencyKey,
  checkoutSessionIdempotencyKey,
  checkoutSessionParams,
} from "../src/lib/billing/checkout-operation";
import {
  isDeletionBlockingStatus,
  isEntitlementStatus,
  mismatchedSubscriptionAction,
  subscriptionLifecycleAction,
} from "../src/lib/billing/subscription-lifecycle";
import { hasBlockingStripeSubscription } from "../src/lib/billing/stripe-subscriptions";
import { storageCleanupRetrySeconds } from "../src/lib/storage/cleanup";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

class DeletionFenceModel {
  state: "active" | "deleting" = "active";
  token: string | null = null;
  stale = false;

  claim(token: string) {
    if (this.state === "active") {
      this.state = "deleting";
      this.token = token;
      this.stale = false;
      return true;
    }
    if (this.stale) {
      this.token = token;
      this.stale = false;
      return true;
    }
    return false;
  }

  pause(token: string) {
    if (this.state !== "deleting" || this.token !== token) return false;
    this.stale = true;
    return true;
  }

  release(token: string) {
    if (this.state !== "deleting" || this.token !== token) return false;
    this.state = "active";
    this.token = null;
    this.stale = false;
    return true;
  }
}

function testOwnerFenceModel() {
  const fence = new DeletionFenceModel();
  assert.equal(fence.claim("owner-a"), true);
  assert.equal(fence.claim("owner-b"), false);
  assert.equal(fence.release("owner-b"), false);
  assert.equal(fence.state, "deleting");
  assert.equal(fence.pause("owner-a"), true);
  assert.equal(fence.claim("owner-b"), true);
  assert.equal(fence.release("owner-a"), false);
  assert.equal(fence.release("owner-b"), true);
  assert.equal(fence.state, "active");
}

function testStableCheckoutIdentity() {
  const workspaceId = "00000000-0000-0000-0000-000000000001";
  const operationId = "00000000-0000-0000-0000-000000000002";
  assert.equal(
    checkoutCustomerIdempotencyKey(workspaceId, operationId),
    checkoutCustomerIdempotencyKey(workspaceId, operationId),
  );
  assert.equal(
    checkoutSessionIdempotencyKey(workspaceId, operationId),
    checkoutSessionIdempotencyKey(workspaceId, operationId),
  );
  assert.notEqual(
    checkoutSessionIdempotencyKey(workspaceId, operationId),
    checkoutSessionIdempotencyKey(
      workspaceId,
      "00000000-0000-0000-0000-000000000003",
    ),
  );

  const params = checkoutSessionParams({
    workspaceId,
    operationId,
    planId: "pro",
    priceId: "price_fixture",
    customerId: "cus_fixture",
    appUrl: "https://paperline.example",
  });
  assert.equal(params.metadata?.checkout_operation_id, operationId);
  assert.equal(
    params.subscription_data?.metadata?.checkout_operation_id,
    operationId,
  );
}

function testSubscriptionLifecycleFencing() {
  assert.equal(subscriptionLifecycleAction("active", "active"), "apply");
  assert.equal(subscriptionLifecycleAction("billing", "active"), "retry");
  assert.equal(subscriptionLifecycleAction("deleting", "active"), "cancel");
  assert.equal(subscriptionLifecycleAction("deleting", "trialing"), "cancel");
  assert.equal(subscriptionLifecycleAction("deleting", "canceled"), "ignore");
  for (const status of ["active", "trialing"] as const) {
    assert.equal(isEntitlementStatus(status), true);
  }
  for (const status of [
    "past_due",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
    "canceled",
  ] as const) {
    assert.equal(isEntitlementStatus(status), false);
  }
  for (const status of [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
  ] as const) {
    assert.equal(isDeletionBlockingStatus(status), true);
  }
  assert.equal(mismatchedSubscriptionAction("sub_current", "sub_old", "canceled"), "ignore");
  assert.equal(mismatchedSubscriptionAction("sub_current", "sub_new", "active"), "cancel");
  assert.equal(mismatchedSubscriptionAction(null, "sub_new", "active"), "continue");
}

async function testSubscriptionPagination() {
  let calls = 0;
  const stripe = {
    subscriptions: {
      list: async () => {
        calls += 1;
        return calls === 1
          ? { data: [{ id: "sub_old", status: "canceled" }], has_more: true }
          : { data: [{ id: "sub_active", status: "active" }], has_more: false };
      },
    },
  };
  assert.equal(
    await hasBlockingStripeSubscription(stripe as never, "cus_fixture"),
    true,
  );
  assert.equal(calls, 2);
}

function testMigrationContracts() {
  const migration = read(
    "supabase/migrations/0017_lifecycle_checkout_recovery.sql",
  );
  assert.match(migration, /drop function if exists public\.claim_workspace_deletion\(uuid\)/);
  assert.match(migration, /claim_workspace_deletion\([\s\S]*p_operation_token uuid/);
  assert.match(migration, /changed_at <= now\(\) - interval '15 minutes'/);
  assert.match(migration, /lifecycle_operation_token = p_operation_token[\s\S]*lifecycle_operation_token = current_token/);
  assert.match(migration, /release_workspace_deletion\([\s\S]*lifecycle_operation_token = p_operation_token/);
  assert.match(migration, /delete_claimed_workspace\([\s\S]*lifecycle_operation_token = p_operation_token/);
  assert.match(migration, /paperline_0017_legacy_deleting_workspace_requires_manual_reconciliation/);
  assert.match(migration, /begin_workspace_destructive_deletion/);
  assert.match(
    migration,
    /begin_workspace_destructive_deletion[\s\S]*lifecycle_operation_phase in \('preflight', 'destructive'\)/,
  );
  assert.match(migration, /renew_workspace_deletion/);
  assert.match(migration, /lifecycle_operation_phase = 'destructive'/);
  assert.match(migration, /workspace_billing_operations_one_pending_idx/);
  assert.match(migration, /where status in \('creating', 'open'\)/);
  assert.match(migration, /record_workspace_checkout_session/);
  assert.match(migration, /claim_workspace_billing\([\s\S]*p_requested_plan text/);
  assert.match(migration, /claim_document_deletion/);
  assert.match(migration, /claim_document_deletion[\s\S]*workspace_operation_leases/);
  assert.match(migration, /finalize_document_deletion/);
  assert.match(migration, /delete from public\.chat_documents[\s\S]*document_id = p_document_id/);
  assert.match(migration, /not exists \([\s\S]*public\.chat_documents cd[\s\S]*cd\.chat_id = c\.id/);
  assert.match(migration, /raise exception 'document_deletion_claim_lost'/);
  assert.match(migration, /'operation_token', p_operation_token/);
  assert.match(migration, /tg_op = 'UPDATE'[\s\S]*old\.workspace_id/);
  assert.match(migration, /reject_non_writable_join_change/);

  const cleanupMigration = read(
    "supabase/migrations/0018_storage_cleanup_jobs.sql",
  );
  assert.match(
    cleanupMigration,
    /create table if not exists public\.storage_cleanup_jobs/,
  );
  assert.match(cleanupMigration, /enable row level security/);
  assert.match(cleanupMigration, /revoke all[\s\S]*anon, authenticated/);
  assert.match(
    cleanupMigration,
    /references public\.workspaces\(id\) on delete cascade/,
  );
}

function testRouteContracts() {
  const checkout = read("src/app/api/billing/checkout/route.ts");
  assert.match(checkout, /operationId: z\.string\(\)\.uuid\(\)/);
  assert.doesNotMatch(checkout, /randomUUID/);
  assert.match(checkout, /ctx\.workspace\.lifecycle_state === "deleting"/);
  assert.doesNotMatch(checkout, /ctx\.workspace\.lifecycle_state !== "active"/);
  assert.match(checkout, /checkoutCustomerIdempotencyKey/);
  assert.match(checkout, /checkoutSessionIdempotencyKey/);
  assert.match(checkout, /record_workspace_checkout_session/);
  assert.match(checkout, /release_workspace_billing/);

  const workspace = read("src/app/api/workspace/route.ts");
  assert.match(workspace, /operationToken: z\.string\(\)\.uuid\(\)/);
  assert.match(workspace, /release_workspace_deletion/);
  assert.match(workspace, /pause_workspace_deletion/);
  assert.match(workspace, /delete_claimed_workspace/);
  assert.match(workspace, /checkout\.sessions\.expire/);
  assert.match(workspace, /hasBlockingStripeSubscription/);
  assert.match(workspace, /beginDestructiveWorkspaceDeletion/);
  assert.match(workspace, /assertWorkspaceDeletionOwner/);

  const document = read("src/app/api/documents/[id]/route.ts");
  assert.match(document, /claim_document_deletion/);
  assert.match(document, /finalize_document_deletion/);
  assert.match(document, /pause_document_deletion/);
  assert.match(document, /replayed: true/);
  assert.doesNotMatch(document, /from\("chats"\)[\s\S]*\.delete\(\)/);

  const documentProcess = read("src/app/api/documents/[id]/process/route.ts");
  assert.match(documentProcess, /begin_workspace_upload/);
  assert.match(documentProcess, /end_workspace_upload/);
  assert.match(documentProcess, /processingLeaseToken/);

  const upload = read("src/app/api/documents/upload/route.ts");
  assert.match(upload, /registerStorageCleanupJob/);
  assert.match(upload, /reconcileStorageCleanupJobs/);
  assert.match(upload, /clearStorageCleanupJob/);

  const webhook = read("src/app/api/webhooks/stripe/route.ts");
  assert.match(webhook, /subscriptionLifecycleAction/);
  assert.match(webhook, /stripe\.subscriptions\.cancel\(sub\.id\)/);
  assert.match(webhook, /eq\("lifecycle_state", "active"\)/);
  assert.match(webhook, /checkout\.session\.expired/);

  const billingPage = read("src/app/(app)/settings/billing/page.tsx");
  assert.match(billingPage, /workspace_billing_operations/);
  assert.match(billingPage, /name="operationId"/);
  const documentButton = read("src/components/delete-document-button.tsx");
  assert.match(documentButton, /paperline:document-delete:/);
  assert.match(documentButton, /operationToken/);
  const workspacePanel = read(
    "src/components/settings/delete-workspace-panel.tsx",
  );
  assert.match(workspacePanel, /paperline:workspace-delete:/);
  assert.match(workspacePanel, /operationToken/);
}

function testStorageCleanupBackoff() {
  assert.equal(storageCleanupRetrySeconds(0), 30);
  assert.equal(storageCleanupRetrySeconds(1), 60);
  assert.equal(storageCleanupRetrySeconds(7), 3600);
  assert.equal(storageCleanupRetrySeconds(100), 3600);
}

async function main() {
  testOwnerFenceModel();
  testStableCheckoutIdentity();
  testSubscriptionLifecycleFencing();
  await testSubscriptionPagination();
  testStorageCleanupBackoff();
  testMigrationContracts();
  testRouteContracts();
  console.log(
    "✓ Lifecycle, deletion, storage cleanup, and Stripe checkout regression checks passed",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
