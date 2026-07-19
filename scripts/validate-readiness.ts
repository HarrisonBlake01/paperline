import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "README.md",
  "SECURITY.md",
  "docs/readiness-tracker.md",
  "docs/security/threat-model.md",
  "docs/security/security-audit.md",
  "docs/qa/test-strategy.md",
  "docs/release/production-readiness.md",
  "docs/portfolio/README.md",
  "docs/portfolio/case-study.md",
  "docs/portfolio/architecture.md",
  "docs/portfolio/interview-talking-points.md",
  "src/app/contact/page.tsx",
  "supabase/migrations/0011_security_hardening.sql",
  "supabase/migrations/0012_workspace_rate_limits.sql",
  "scripts/validate-parser-runtime.ts",
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

console.log(`✓ Readiness artifacts validated (${required.length} required files)`);
