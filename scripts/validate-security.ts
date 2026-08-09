import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  MAX_UPLOAD_BYTES,
  sanitizeUploadFilename,
  validateUploadContent,
} from "../src/lib/security/upload";
import { isStripeSecretKeyAllowed } from "../src/lib/stripe";
import { parseUuidParam } from "../src/lib/http/params";
import { getDocumentFailureCode } from "../src/lib/documents/failure";
import { normalizeCitedAnswer } from "../src/lib/ai/chat";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

function testUploadValidation() {
  assert.equal(
    validateUploadContent({
      declaredMime: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\nsynthetic"),
    }),
    null,
  );
  assert.equal(
    validateUploadContent({
      declaredMime: "application/pdf",
      buffer: Buffer.from("<script>not a pdf</script>"),
    }),
    "content_type_mismatch",
  );
  assert.equal(
    validateUploadContent({
      declaredMime: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]),
    }),
    null,
  );
  assert.equal(
    validateUploadContent({
      declaredMime: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    }),
    null,
  );
  assert.equal(
    validateUploadContent({
      declaredMime: "text/plain",
      buffer: Buffer.from([0x00, 0x01, 0x02]),
    }),
    "content_type_mismatch",
  );
  assert.equal(
    validateUploadContent({
      declaredMime: "application/zip",
      buffer: Buffer.from("PK synthetic"),
    }),
    "unsupported_type",
  );
  assert.equal(
    validateUploadContent({
      declaredMime:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from("[Content_Types].xml word/document.xml"),
      ]),
    }),
    null,
  );
  assert.equal(
    validateUploadContent({
      declaredMime: "text/plain",
      buffer: Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x41),
    }),
    "file_too_large",
  );

  assert.deepEqual(sanitizeUploadFilename("../../Client Contract.pdf"), {
    displayName: "Client Contract.pdf",
    storageName: "Client_Contract.pdf",
  });
  assert.equal(sanitizeUploadFilename(".../").storageName, "document");
}

function testSecurityInvariants() {
  assert.equal(parseUuidParam("8b825b1e-855d-4d21-af51-429dfcb4b78c"), "8b825b1e-855d-4d21-af51-429dfcb4b78c");
  assert.equal(parseUuidParam("00000000-0000-0000-0000-000000000001"), "00000000-0000-0000-0000-000000000001");
  assert.equal(parseUuidParam("not-a-uuid"), null);
  assert.equal(getDocumentFailureCode("Incorrect API key supplied"), "ai_configuration_error");
  assert.equal(getDocumentFailureCode("rate limit exceeded"), "ai_capacity_error");
  assert.equal(getDocumentFailureCode("provider stack trace"), "processing_failed");
  assert.deepEqual(normalizeCitedAnswer("See [3], then [1], not [9].", 3), {
    answer: "See [1], then [2], not .",
    indexes: [2, 0],
  });

  const testStripeKey = ["sk", "test", "synthetic"].join("_");
  const liveStripeKey = ["sk", "live", "synthetic"].join("_");
  assert.equal(isStripeSecretKeyAllowed(testStripeKey, false, false), true);
  assert.equal(isStripeSecretKeyAllowed(liveStripeKey, false, false), false);
  assert.equal(isStripeSecretKeyAllowed(liveStripeKey, true, false), true);

  assert.equal(isStripeSecretKeyAllowed(testStripeKey, true, true), true);
  assert.equal(isStripeSecretKeyAllowed(liveStripeKey, true, true), false);

  const billingPage = read("src/app/(app)/settings/billing/page.tsx");
  assert.match(billingPage, /PAPERLINE_RECRUITER_DEMO/);
  assert.match(billingPage, /Recruiter demo/);
  assert.match(billingPage, /No real payment method will be charged/);

  const homePage = read("src/app/page.tsx");
  assert.match(homePage, /PAPERLINE_RECRUITER_DEMO/);
  assert.match(homePage, /Recruiter demo · synthetic data · Stripe test mode only/);
  assert.match(homePage, /Recruiter demo — test checkout only/);
  assert.match(homePage, /No real payment method will be charged/);
  assert.match(homePage, /owner&apos;s capped provider budget/);

  const proxy = read("src/proxy.ts");
  assert.doesNotMatch(proxy, /x-internal-trigger/i);
  assert.doesNotMatch(proxy, /createRouteMatcher/);
  assert.match(proxy, /clerkMiddleware\(\)/);

  const appLayout = read("src/app/(app)/layout.tsx");
  assert.match(appLayout, /await auth\(\)/);
  assert.match(appLayout, /redirect\("\/sign-in"\)/);

  const workspaceAuth = read("src/lib/auth/workspace.ts");
  assert.match(workspaceAuth, /await auth\(\)/);

  const mcpRoute = read("src/app/api/mcp/route.ts");
  assert.match(mcpRoute, /handlePaperlineMcpRequest/);
  const readinessRouteContract = read("src/app/api/readiness/route.ts");
  assert.match(readinessRouteContract, /PAPERLINE_READINESS_TOKEN/);

  const uploadRoute = read("src/app/api/documents/upload/route.ts");
  assert.match(uploadRoute, /validateUploadContent/);
  assert.match(uploadRoute, /eq\("workspace_id", ctx\.workspace\.id\)/);
  assert.match(uploadRoute, /storage[\s\S]*\.from\(bucket\)[\s\S]*\.remove/);
  assert.match(uploadRoute, /await processDocument/);
  assert.doesNotMatch(uploadRoute, /void processDocument/);
  assert.doesNotMatch(
    uploadRoute,
    /error:\s*"storage_upload_failed",\s*detail:/,
  );

  const config = read("next.config.ts");
  for (const header of [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Cross-Origin-Opener-Policy",
    "Content-Security-Policy-Report-Only",
  ]) {
    assert.match(config, new RegExp(header));
  }
  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "connect-src 'self'",
    "frame-src",
    "worker-src 'self'",
  ]) {
    assert.match(config, new RegExp(directive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const sentryConfigs = [
    read("src/instrumentation-client.ts"),
    read("src/sentry.server.config.ts"),
    read("src/sentry.edge.config.ts"),
  ];
  for (const sentryConfig of sentryConfigs) {
    assert.match(sentryConfig, /sendDefaultPii:\s*false/);
    assert.match(sentryConfig, /userInfo:\s*false/);
    assert.match(sentryConfig, /cookies:\s*false/);
    assert.match(sentryConfig, /httpHeaders:\s*\{\s*request:\s*false,\s*response:\s*false\s*\}/);
    assert.match(sentryConfig, /httpBodies:\s*\[\]/);
    assert.match(sentryConfig, /queryParams:\s*false/);
    assert.match(sentryConfig, /genAI:\s*\{\s*inputs:\s*false,\s*outputs:\s*false\s*\}/);
    assert.match(sentryConfig, /enableLogs:\s*false/);
    assert.match(sentryConfig, /tracesSampler:/);
    assert.match(sentryConfig, /beforeSend:\s*scrubSentryEvent/);
    assert.match(sentryConfig, /beforeSendTransaction:\s*scrubSentryEvent/);
    assert.match(sentryConfig, /beforeSendSpan:\s*scrubSentrySpan/);
    assert.match(sentryConfig, /beforeBreadcrumb:\s*scrubSentryBreadcrumb/);
    assert.doesNotMatch(sentryConfig, /replayIntegration|enableLogs:\s*true|includeLocalVariables:\s*true/);
  }
  assert.match(sentryConfigs[0], /tracePropagationTargets:\s*\[\]/);
  assert.match(sentryConfigs[0], /replaysSessionSampleRate:\s*0/);
  assert.match(sentryConfigs[0], /replaysOnErrorSampleRate:\s*0/);
  const sentryPrivacy = read("src/lib/observability/sentry-privacy.ts");
  for (const deniedField of ["event.user", "event.extra", "event.contexts", "event.tags"]) {
    assert.match(sentryPrivacy, new RegExp(`delete ${deniedField.replace(".", "\\.")}`));
  }
  assert.match(sentryPrivacy, /event\.request = \{/);
  assert.match(sentryPrivacy, /event\.message = REDACTED/);
  assert.match(sentryPrivacy, /delete frame\.context_line/);
  assert.match(sentryPrivacy, /delete frame\.vars/);
  assert.match(sentryPrivacy, /span\.data = undefined/);

  const health = read("src/app/api/health/route.ts");
  assert.match(health, /dependencies_checked:\s*false/);
  assert.doesNotMatch(health, /env_missing|status:\s*"ready"/);
  assert.match(health, /Cache-Control/);

  for (const route of [
    "src/app/api/chats/[id]/messages/route.ts",
    "src/app/api/community-templates/[id]/use/route.ts",
    "src/app/api/community-templates/[id]/vote/route.ts",
    "src/app/api/documents/[id]/extract/route.ts",
    "src/app/api/documents/[id]/generate-template/route.ts",
    "src/app/api/documents/[id]/process/route.ts",
    "src/app/api/documents/[id]/route.ts",
    "src/app/api/templates/[id]/publish/route.ts",
    "src/app/api/templates/[id]/route.ts",
  ]) {
    assert.match(read(route), /parseUuidParam/);
  }

  const editableTemplateRoute = read("src/app/api/templates/[id]/route.ts");
  assert.match(editableTemplateRoute, /eq\("workspace_id", ctx\.workspace\.id\)/);
  assert.doesNotMatch(editableTemplateRoute, /:\s*error\.message/);

  const pipeline = read("src/lib/pipeline/index.ts");
  assert.match(pipeline, /\.in\("status", \["queued", "failed"\]\)/);
  assert.match(pipeline, /getDocumentFailureCode/);
  assert.doesNotMatch(pipeline, /detail:\s*message/);

  const documentPage = read("src/app/(app)/documents/[id]/page.tsx");
  assert.doesNotMatch(documentPage, /\{doc\.error_message\}/);
  assert.doesNotMatch(documentPage, /\{ex\.error_message\}/);

  const documentDeleteRoute = read("src/app/api/documents/[id]/route.ts");
  assert.match(documentDeleteRoute, /eq\("workspace_id", ctx\.workspace\.id\)/);
  assert.match(documentDeleteRoute, /storage[\s\S]*\.remove\(\[document\.storage_path\]\)/);
  assert.match(documentDeleteRoute, /claim_document_deletion/);
  assert.match(documentDeleteRoute, /finalize_document_deletion/);
  assert.match(documentDeleteRoute, /pause_document_deletion/);
  assert.doesNotMatch(documentDeleteRoute, /from\("chats"\)[\s\S]*\.delete\(\)/);
  assert.doesNotMatch(documentDeleteRoute, /filename/);

  const settingsPage = read("src/app/(app)/settings/page.tsx");
  assert.match(settingsPage, /canViewAdminData\s*\?\s*await Promise\.all/);
  assert.match(settingsPage, /ctx\.role === "owner"[\s\S]*DeleteWorkspacePanel/);

  const workspaceDeleteRoute = read("src/app/api/workspace/route.ts");
  assert.match(workspaceDeleteRoute, /ctx\.role !== "owner"/);
  assert.match(workspaceDeleteRoute, /stripe_subscription_id/);
  assert.match(workspaceDeleteRoute, /claimWorkspaceDeletion/);
  assert.match(workspaceDeleteRoute, /rpc\("claim_workspace_deletion"/);
  assert.match(workspaceDeleteRoute, /p_operation_token:\s*operationToken/);
  assert.match(workspaceDeleteRoute, /release_workspace_deletion/);
  assert.match(workspaceDeleteRoute, /delete_claimed_workspace/);
  assert.match(workspaceDeleteRoute, /final storage verification failed/);
  assert.match(workspaceDeleteRoute, /hasBlockingStripeSubscription/);
  assert.match(workspaceDeleteRoute, /begin_workspace_destructive_deletion/);
  assert.match(workspaceDeleteRoute, /renew_workspace_deletion/);
  assert.match(workspaceDeleteRoute, /workspaceId !== ctx\.workspace\.id/);
  assert.match(workspaceDeleteRoute, /confirmation !== ctx\.workspace\.name/);
  assert.match(workspaceDeleteRoute, /\.list\(prefix,[\s\S]*offset/);
  assert.match(workspaceDeleteRoute, /entry\.id === null/);
  assert.match(workspaceDeleteRoute, /STORAGE_REMOVE_BATCH_SIZE/);
  assert.match(workspaceDeleteRoute, /customers\.del/);
  assert.match(workspaceDeleteRoute, /resource_missing/);
  assert.doesNotMatch(workspaceDeleteRoute, /from\("workspaces"\)[\s\S]*\.delete\(\)/);
  assert.doesNotMatch(workspaceDeleteRoute, /console\.error\([^\n]*error\)/);
  const billingCheckoutRoute = read("src/app/api/billing/checkout/route.ts");
  assert.match(billingCheckoutRoute, /claimBillingOperation/);
  assert.match(billingCheckoutRoute, /rpc\("claim_workspace_billing"/);
  assert.match(billingCheckoutRoute, /operationId:\s*z\.string\(\)\.uuid/);
  assert.match(billingCheckoutRoute, /checkoutCustomerIdempotencyKey/);
  assert.match(billingCheckoutRoute, /checkoutSessionIdempotencyKey/);
  assert.match(billingCheckoutRoute, /record_workspace_checkout_session/);
  assert.match(billingCheckoutRoute, /hasBlockingStripeSubscription/);
  assert.match(billingCheckoutRoute, /existing_subscription/);
  assert.match(billingCheckoutRoute, /release_workspace_billing/);
  assert.match(billingCheckoutRoute, /workspace_operation_in_progress/);
  assert.doesNotMatch(billingCheckoutRoute, /randomUUID/);
  const stripeSubscriptionPolicy = read(
    "src/lib/billing/stripe-subscriptions.ts",
  );
  assert.match(stripeSubscriptionPolicy, /do \{/);
  assert.match(stripeSubscriptionPolicy, /while \(startingAfter\)/);
  assert.match(stripeSubscriptionPolicy, /starting_after/);
  assert.match(stripeSubscriptionPolicy, /isDeletionBlockingStatus/);
  const documentUploadRoute = read("src/app/api/documents/upload/route.ts");
  assert.match(documentUploadRoute, /if \(insErr\)[\s\S]*\.remove\(\[storagePath\]\)/);
  assert.match(documentUploadRoute, /begin_workspace_upload/);
  assert.match(documentUploadRoute, /end_workspace_upload/);
  assert.match(documentUploadRoute, /storage_cleanup_pending/);
  const integrationsPage = read("src/app/(app)/integrations/page.tsx");
  assert.match(integrationsPage, /ctx && canManage/);

  for (const aiPath of [
    "src/lib/ai/chat.ts",
    "src/lib/ai/extract.ts",
    "src/lib/ai/template.ts",
  ]) {
    assert.match(read(aiPath), /untrusted data/i);
  }

  const pdfParser = read("src/lib/parsing/pdf.ts");
  const pdfTextWorker = read("src/lib/parsing/pdf-text-worker.mjs");
  const pdfOcr = read("src/lib/parsing/pdf-ocr.ts");
  const pdfRenderWorker = read("src/lib/parsing/pdf-render-worker.mjs");
  const nextConfig = read("next.config.ts");
  assert.doesNotMatch(pdfParser, /(?:from |import\()["']pdf-parse/);
  assert.match(pdfParser, /Reflect\.construct\(Worker/);
  assert.match(pdfParser, /resourceLimits/);
  assert.match(pdfParser, /maxOldGenerationSizeMb/);
  assert.match(pdfParser, /PDF_PARSE_DEADLINE_MS\s*=\s*10_000/);
  assert.match(pdfParser, /PDF_DECODE_ALLOCATION_BUDGET_BYTES\s*=\s*32\s*\*\s*1024\s*\*\s*1024/);
  assert.match(pdfParser, /decodeAllocationLimitBytes/);
  assert.doesNotMatch(pdfParser, /require\.resolve\(/);
  assert.doesNotMatch(pdfParser, /standardFontDataUrl|pdfjsWorkerSrc/);
  assert.match(pdfParser, /pdf_resource_limit_exceeded/);
  assert.match(pdfParser, /pdf_parse_deadline_exceeded/);
  assert.match(pdfTextWorker, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  assert.doesNotMatch(pdfTextWorker, /pdf-parse/);
  assert.match(pdfTextWorker, /require\.resolve\("pdfjs-dist\/package\.json"\)/);
  assert.match(pdfTextWorker, /MAX_PDF_TEXT_PAGES\s*=\s*250/);
  assert.match(pdfTextWorker, /MAX_PDF_TEXT_CHARACTERS\s*=\s*200_000/);
  assert.match(pdfTextWorker, /streamTextContent\(\)/);
  assert.match(pdfTextWorker, /__paperlinePdfDecodeAllocationLimitBytes/);
  assert.match(pdfTextWorker, /pdf_page_limit_exceeded/);
  assert.match(pdfTextWorker, /pdf_text_limit_exceeded/);
  assert.match(pdfTextWorker, /pdf_decoded_stream_limit_exceeded/);
  assert.match(pdfTextWorker, /standardFontDataUrl/);
  assert.match(pdfTextWorker, /pdfjsWorkerSrc/);
  assert.match(nextConfig, /pdfjs-dist\/package\.json/);
  assert.match(nextConfig, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  const pdfjsPatch = read("patches/pdfjs-dist@6.2.108.patch");
  assert.match(pdfjsPatch, /pdf_decoded_stream_limit_exceeded/);
  assert.match(pdfjsPatch, /paperlineChargeDecodedAllocation/);
  assert.match(pdfjsPatch, /for await \(const chunk of readable\)/);
  assert.match(pdfjsPatch, /Preserve explicit Paperline decode budgets/);
  const packageJson = read("package.json");
  assert.match(packageJson, /"pdfjs-dist@6\.2\.108":\s*"patches\/pdfjs-dist@6\.2\.108\.patch"/);
  assert.doesNotMatch(pdfOcr, /SWIFT_RENDER_SCRIPT|execFileAsync|pdf-parse/);
  assert.doesNotMatch(pdfOcr, /pdfjs-dist|@napi-rs\/canvas/);
  assert.match(pdfOcr, /Reflect\.construct\(Worker/);
  assert.match(pdfOcr, /PDF_RENDER_DECODE_BUDGET_BYTES\s*=\s*32\s*\*\s*1024\s*\*\s*1024/);
  assert.match(pdfOcr, /PDF_RENDER_DEADLINE_MS\s*=\s*15_000/);
  assert.match(pdfOcr, /resourceLimits/);
  assert.match(pdfOcr, /pdf-render-worker\.mjs/);
  assert.match(pdfRenderWorker, /__paperlinePdfDecodeAllocationLimitBytes/);
  assert.match(pdfRenderWorker, /require\.resolve\("pdfjs-dist\/package\.json"\)/);
  assert.match(pdfRenderWorker, /MAX_RENDER_PIXELS\s*=\s*16_000_000/);
  assert.match(pdfRenderWorker, /pdf_page_dimensions_exceeded/);
  assert.match(pdfRenderWorker, /pdf_decoded_stream_limit_exceeded/);
  assert.match(pdfRenderWorker, /import\("@napi-rs\/canvas"\)/);
  assert.match(nextConfig, /src\/lib\/parsing\/pdf-render-worker\.mjs/);
  assert.match(nextConfig, /serverExternalPackages:\s*\["pdfjs-dist", "@napi-rs\/canvas"\]/);

  const healthRoute = read("src/app/api/health/route.ts");
  assert.match(healthRoute, /dependencies_checked:\s*false/);
  assert.doesNotMatch(healthRoute, /status:\s*"ready"/);

  const migration = read("supabase/migrations/0011_security_hardening.sql");
  assert.match(migration, /set search_path = public, pg_temp/);
  assert.match(migration, /revoke all on function public\.is_workspace_member/);
  assert.match(migration, /create policy chat_documents_all/);
  assert.match(migration, /c\.workspace_id = d\.workspace_id/);
  assert.match(migration, /create policy workflow_items_all/);
  assert.match(migration, /with check/);

  const rateLimitMigration = read("supabase/migrations/0012_workspace_rate_limits.sql");
  assert.match(rateLimitMigration, /primary key \(workspace_id, action, window_start\)/);
  assert.match(rateLimitMigration, /security definer/);
  assert.match(rateLimitMigration, /revoke all on function public\.consume_workspace_rate_limit/);

  const agentCredentialMigration = read(
    "supabase/migrations/0013_agent_credentials.sql",
  );
  assert.match(agentCredentialMigration, /scopes text\[\] not null default '\{\}'/);
  assert.match(agentCredentialMigration, /expires_at timestamptz/);
  assert.match(agentCredentialMigration, /api_keys_key_hash_unique_idx/);
  assert.match(agentCredentialMigration, /documents:read/);

  const lifecycleMigration = read(
    "supabase/migrations/0014_workspace_lifecycle.sql",
  );
  assert.match(lifecycleMigration, /lifecycle_state in \('active', 'billing', 'deleting'\)/);
  assert.match(lifecycleMigration, /security definer/);
  assert.match(lifecycleMigration, /set search_path = public, pg_temp/);
  assert.match(lifecycleMigration, /raise exception 'workspace_not_writable'/);
  assert.match(lifecycleMigration, /documents_require_writable_workspace/);
  assert.match(lifecycleMigration, /api_keys_require_writable_workspace/);

  const operationFencingMigration = read(
    "supabase/migrations/0015_workspace_operation_fencing.sql",
  );
  assert.match(operationFencingMigration, /lifecycle_operation_token/);
  assert.match(operationFencingMigration, /workspace_operation_leases/);
  assert.match(operationFencingMigration, /begin_workspace_upload/);
  assert.match(operationFencingMigration, /end_workspace_upload/);
  assert.match(operationFencingMigration, /claim_workspace_deletion/);
  assert.match(operationFencingMigration, /for update/);
  const billingClaimMigration = read(
    "supabase/migrations/0016_workspace_billing_claim.sql",
  );
  assert.match(billingClaimMigration, /claim_workspace_billing/);
  assert.match(billingClaimMigration, /workspace_operation_leases/);
  assert.match(billingClaimMigration, /for update/);
  const lifecycleRecoveryMigration = read(
    "supabase/migrations/0017_lifecycle_checkout_recovery.sql",
  );
  assert.match(lifecycleRecoveryMigration, /workspace_billing_operations/);
  assert.match(lifecycleRecoveryMigration, /release_workspace_deletion/);
  assert.match(lifecycleRecoveryMigration, /delete_claimed_workspace/);
  assert.match(lifecycleRecoveryMigration, /finalize_document_deletion/);
  assert.match(lifecycleRecoveryMigration, /reject_non_writable_join_change/);

  const workspaceAuthSource = read("src/lib/auth/workspace.ts");
  assert.match(workspaceAuthSource, /workspace\.lifecycle_state !== "active"/);
  assert.match(workspaceAuthSource, /workspace_temporarily_unavailable/);

  const mcpAuth = read("src/lib/mcp/auth.ts");
  assert.match(mcpAuth, /revoked_at/);
  assert.match(mcpAuth, /expiresAt <= Date\.now\(\)/);
  assert.match(mcpAuth, /workspace_members/);
  assert.match(mcpAuth, /PLANS[\s\S]*apiAccess/);

  const mcpHttp = read("src/lib/mcp/http.ts");
  assert.match(mcpHttp, /MCP_MAX_REQUEST_BYTES = 128 \* 1024/);
  assert.match(mcpHttp, /batch_requests_not_supported/);
  assert.match(mcpHttp, /PAPERLINE_MCP_ALLOWED_HOSTS/);
  assert.match(mcpHttp, /consumeWorkspaceRateLimit/);
  assert.doesNotMatch(mcpHttp, /Access-Control-Allow-Origin.*\*/);

  const mcpServer = read("src/lib/mcp/server.ts");
  assert.match(mcpServer, /readOnlyHint: true/);
  assert.match(mcpServer, /untrusted_workspace_data/);
  assert.doesNotMatch(mcpServer, /shell|raw storage|arbitrary SQL/i);

  const readinessRoute = read("src/app/api/readiness/route.ts");
  assert.match(readinessRoute, /isReadinessAuthorized/);
  assert.match(readinessRoute, /status: result\.ready \? 200 : 503/);
  assert.match(readinessRoute, /Cache-Control[\s\S]*no-store/);

  for (const route of [
    "src/app/api/chats/[id]/messages/route.ts",
    "src/app/api/documents/[id]/extract/route.ts",
    "src/app/api/documents/[id]/generate-template/route.ts",
    "src/app/api/documents/[id]/process/route.ts",
    "src/app/api/documents/upload/route.ts",
    "src/app/api/workflows/route.ts",
  ]) {
    assert.match(read(route), /enforceWorkspaceRateLimit/);
  }

  const rateLimitHelper = read("src/lib/security/rate-limit.ts");
  assert.match(rateLimitHelper, /status: 429/);
  assert.match(rateLimitHelper, /status: 503/);
  assert.match(rateLimitHelper, /Retry-After/);

  const pkg = JSON.parse(read("package.json")) as {
    dependencies: { next: string; "@modelcontextprotocol/sdk": string };
  };
  assert.equal(pkg.dependencies["@modelcontextprotocol/sdk"], "1.30.0");
  const nextVersion = pkg.dependencies.next.replace(/^[^0-9]*/, "");
  const [major, minor, patch] = nextVersion.split(".").map(Number);
  assert.ok(
    major > 16 ||
      (major === 16 && (minor > 2 || (minor === 2 && patch >= 11))),
    `Next.js ${nextVersion} must include the July 2026 security fixes`,
  );
}

testUploadValidation();
testSecurityInvariants();
console.log("✓ Security regression checks passed");
