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

  assert.equal(isStripeSecretKeyAllowed("sk_test_synthetic", false), true);
  assert.equal(isStripeSecretKeyAllowed("sk_live_synthetic", false), false);
  assert.equal(isStripeSecretKeyAllowed("sk_live_synthetic", true), true);

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
  assert.match(uploadRoute, /storage\.from\(bucket\)\.remove/);
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

  const settingsPage = read("src/app/(app)/settings/page.tsx");
  assert.match(settingsPage, /canViewAdminData\s*\?\s*await Promise\.all/);
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
  const pdfOcr = read("src/lib/parsing/pdf-ocr.ts");
  const nextConfig = read("next.config.ts");
  assert.match(pdfParser, /import\("pdf-parse"\)/);
  assert.doesNotMatch(pdfOcr, /SWIFT_RENDER_SCRIPT|execFileAsync/);
  assert.match(nextConfig, /serverExternalPackages:\s*\["pdf-parse", "@napi-rs\/canvas"\]/);

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
  assert.equal(pkg.dependencies["@modelcontextprotocol/sdk"], "1.29.0");
  const nextVersion = pkg.dependencies.next.replace(/^[^0-9]*/, "");
  const [major, minor, patch] = nextVersion.split(".").map(Number);
  assert.ok(
    major > 16 ||
      (major === 16 && (minor > 2 || (minor === 2 && patch >= 6))),
    `Next.js ${nextVersion} must include the proxy-bypass fix`,
  );
}

testUploadValidation();
testSecurityInvariants();
console.log("✓ Security regression checks passed");
