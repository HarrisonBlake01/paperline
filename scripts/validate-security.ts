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
  assert.match(proxy, /auth\.protect/);

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
  ]) {
    assert.match(config, new RegExp(header));
  }

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
    dependencies: { next: string };
  };
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
