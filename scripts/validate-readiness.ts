import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isReadinessAuthorized,
  READINESS_CHECKS,
  runReadinessChecks,
  type ReadinessProbes,
} from "../src/lib/readiness";

const root = process.cwd();
const required = [
  "README.md",
  "SECURITY.md",
  "docs/readiness-tracker.md",
  "docs/security/threat-model.md",
  "docs/security/security-audit.md",
  "docs/qa/test-strategy.md",
  "docs/qa/secure-runtime-test-matrix.md",
  "docs/release/production-readiness.md",
  "docs/release/environment-matrix.md",
  "docs/release/secure-runtime-runbook.md",
  "docs/runtime/runtime-findings.md",
  "docs/integrations/paperline-mcp.md",
  "docs/security/agent-integration-threat-model.md",
  "docs/portfolio/presentation-claims-audit.md",
  "docs/portfolio/README.md",
  "docs/portfolio/case-study.md",
  "docs/portfolio/architecture.md",
  "docs/portfolio/interview-talking-points.md",
  "src/app/contact/page.tsx",
  "supabase/migrations/0011_security_hardening.sql",
  "supabase/migrations/0012_workspace_rate_limits.sql",
  "supabase/migrations/0013_agent_credentials.sql",
  "supabase/migrations/0014_workspace_lifecycle.sql",
  "supabase/migrations/0015_workspace_operation_fencing.sql",
  "supabase/migrations/0016_workspace_billing_claim.sql",
  "supabase/migrations/0017_lifecycle_checkout_recovery.sql",
  "supabase/migrations/0018_storage_cleanup_jobs.sql",
  "src/lib/storage/cleanup.ts",
  "src/lib/parsing/pdf-text-worker.mjs",
  "src/lib/parsing/pdf-render-worker.mjs",
  "scripts/validate-parser-runtime.ts",
  "scripts/validate-mcp.ts",
];

for (const relativePath of required) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

const markdownFiles = required.filter((file) => file.endsWith(".md"));
const broken: string[] = [];
const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;

for (const relativePath of markdownFiles) {
  const absolutePath = path.join(root, relativePath);
  const markdown = fs.readFileSync(absolutePath, "utf8");
  for (const match of markdown.matchAll(linkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (
      !rawTarget ||
      rawTarget.startsWith("#") ||
      /^(https?:|mailto:)/i.test(rawTarget)
    ) {
      continue;
    }
    const target = decodeURIComponent(rawTarget.split(/[?#]/, 1)[0]);
    const resolved = path.resolve(path.dirname(absolutePath), target);
    if (!fs.existsSync(resolved)) {
      broken.push(`${relativePath} -> ${rawTarget}`);
    }
  }
}

assert.deepEqual(broken, [], `Broken local Markdown links:\n${broken.join("\n")}`);

const readiness = fs.readFileSync(
  path.join(root, "docs/readiness-tracker.md"),
  "utf8",
);
assert.match(readiness, /NO-GO/);
assert.match(readiness, /Implemented|Complete/);
assert.match(readiness, /Demo|recruiter/);
assert.match(readiness, /Planned|Follow-up/);

const architecture = fs.readFileSync(
  path.join(root, "docs/portfolio/architecture.md"),
  "utf8",
);
assert.match(architecture, /```mermaid/);
assert.match(architecture, /0011_security_hardening\.sql/);
assert.match(architecture, /Paperline MCP/);

const integration = fs.readFileSync(
  path.join(root, "docs/integrations/paperline-mcp.md"),
  "utf8",
);
assert.match(
  integration,
  /Implemented and verified in the isolated candidate \/ production publication not approved/,
);
assert.match(integration, /hermes mcp test paperline/);
assert.match(integration, /nemoclaw <sandbox> mcp add paperline/);
assert.doesNotMatch(integration, /Nous[- ]reviewed integration/i);

const integrationsPage = fs.readFileSync(
  path.join(root, "src/app/(app)/integrations/page.tsx"),
  "utf8",
);
const accessPanel = fs.readFileSync(
  path.join(root, "src/components/integrations/api-keys-panel.tsx"),
  "utf8",
);
assert.match(integrationsPage, /name: "MCP \/ API"/);
assert.match(integrationsPage, /available: true/);
assert.match(accessPanel, /Bring your own LLM/);
assert.match(accessPanel, /Included on Free/);
assert.match(accessPanel, /Streamable HTTP/);

const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
assert.match(nextConfig, /outputFileTracingIncludes/);
assert.match(nextConfig, /src\/lib\/parsing\/pdf-text-worker\.mjs/);
assert.match(nextConfig, /src\/lib\/parsing\/pdf-render-worker\.mjs/);
assert.match(nextConfig, /pdfjs-dist\/package\.json/);
assert.match(nextConfig, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
assert.match(nextConfig, /pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs/);
assert.match(nextConfig, /@napi-rs\/canvas-\*\/\*\*\/\*/);

const readinessImplementation = fs.readFileSync(
  path.join(root, "src/lib/readiness.ts"),
  "utf8",
);
assert.match(readinessImplementation, /import\("@napi-rs\/canvas"\)/);
assert.match(
  readinessImplementation,
  /import\("pdfjs-dist\/legacy\/build\/pdf\.mjs"\)/,
);
assert.match(
  readinessImplementation,
  /import\("pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs"\)/,
);

const pdfParser = fs.readFileSync(
  path.join(root, "src/lib/parsing/pdf.ts"),
  "utf8",
);
const pdfTextWorker = fs.readFileSync(
  path.join(root, "src/lib/parsing/pdf-text-worker.mjs"),
  "utf8",
);
const pdfOcr = fs.readFileSync(
  path.join(root, "src/lib/parsing/pdf-ocr.ts"),
  "utf8",
);
const pdfRenderWorker = fs.readFileSync(
  path.join(root, "src/lib/parsing/pdf-render-worker.mjs"),
  "utf8",
);
assert.match(pdfParser, /Reflect\.construct\(Worker/);
assert.match(pdfParser, /resourceLimits/);
assert.match(pdfParser, /decodeAllocationLimitBytes/);
assert.doesNotMatch(pdfParser, /require\.resolve\(/);
assert.doesNotMatch(pdfParser, /standardFontDataUrl|pdfjsWorkerSrc/);
assert.match(pdfTextWorker, /await import\("pdfjs-dist\/legacy\/build\/pdf\.mjs"\)/);
assert.match(pdfTextWorker, /streamTextContent\(\)/);
assert.match(pdfTextWorker, /__paperlinePdfDecodeAllocationLimitBytes/);
assert.match(pdfTextWorker, /require\.resolve\("pdfjs-dist\/package\.json"\)/);
assert.match(pdfOcr, /Reflect\.construct\(Worker/);
assert.match(pdfOcr, /PDF_RENDER_DECODE_BUDGET_BYTES/);
assert.doesNotMatch(pdfOcr, /pdfjs-dist|@napi-rs\/canvas/);
assert.match(pdfRenderWorker, /await import\("pdfjs-dist\/legacy\/build\/pdf\.mjs"\)/);
assert.match(pdfRenderWorker, /__paperlinePdfDecodeAllocationLimitBytes/);
assert.match(pdfRenderWorker, /MAX_RENDER_PIXELS\s*=\s*16_000_000/);
for (const implementation of [pdfParser, pdfTextWorker, pdfOcr, pdfRenderWorker]) {
  assert.doesNotMatch(implementation, /(?:from |import\()["']pdf-parse/);
}

async function testReadinessBehavior() {
  const token = "r".repeat(48);
  assert.equal(isReadinessAuthorized(`Bearer ${token}`, token), true);
  assert.equal(isReadinessAuthorized(`Bearer ${"x".repeat(48)}`, token), false);
  assert.equal(isReadinessAuthorized(null, token), false);
  assert.equal(isReadinessAuthorized(`Bearer ${token}`, "short"), false);

  const passing = Object.fromEntries(
    READINESS_CHECKS.map((name) => [name, async () => undefined]),
  ) as ReadinessProbes;
  assert.deepEqual(await runReadinessChecks(passing), {
    ready: true,
    checks: READINESS_CHECKS.map((name) => ({ name, ok: true })),
  });

  const failing = {
    ...passing,
    database: async () => {
      throw new Error("synthetic failure");
    },
  };
  const failed = await runReadinessChecks(failing);
  assert.equal(failed.ready, false);
  assert.deepEqual(
    failed.checks.find((check) => check.name === "database"),
    { name: "database", ok: false },
  );
}

void testReadinessBehavior()
  .then(() => {
    console.log(`✓ Readiness artifacts validated (${required.length} required files)`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
