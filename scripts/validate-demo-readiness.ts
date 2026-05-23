import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures: string[] = [];

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

const pkg = JSON.parse(read("package.json")) as { name?: string; scripts?: Record<string, string> };
expect(pkg.name === "paperline", 'package.json should use the professional package name "paperline".');

const processRoute = read("src/app/api/documents/[id]/process/route.ts");
expect(
  !processRoute.includes("x-internal-trigger"),
  "document processing route should not trust a spoofable x-internal-trigger header.",
);
expect(
  processRoute.includes("requireWorkspace"),
  "document processing route should require an authenticated workspace context.",
);
expect(
  processRoute.includes('.eq("workspace_id", ctx.workspace.id)') ||
    processRoute.includes(".eq(\"workspace_id\", ctx.workspace.id)"),
  "document processing route should verify the document belongs to the active workspace before processing.",
);

const uploadRoute = read("src/app/api/documents/upload/route.ts");
expect(
  uploadRoute.includes("processDocument"),
  "upload route should trigger processing server-side without calling a public internal HTTP endpoint.",
);
expect(
  !uploadRoute.includes("x-internal-trigger"),
  "upload route should not rely on a spoofable internal trigger header.",
);

expect(existsSync(join(root, "SECURITY.md")), "SECURITY.md should exist for mentor/security review.");
expect(existsSync(join(root, "docs/mentor-demo.md")), "docs/mentor-demo.md should exist for the mentor demo path.");

const readme = read("README.md");
for (const phrase of [
  "Designed for sensitive documents",
  "Demo workflow",
  "Security and privacy posture",
]) {
  expect(readme.includes(phrase), `README.md should include: ${phrase}`);
}

if (failures.length) {
  console.error("Demo-readiness validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("✓ Demo-readiness repository checks passed");
