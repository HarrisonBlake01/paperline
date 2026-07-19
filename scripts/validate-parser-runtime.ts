import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parsePdf } from "../src/lib/parsing/pdf";
import { renderPdfPages } from "../src/lib/parsing/pdf-ocr";

const fixture = path.join(
  process.cwd(),
  "docs/portfolio/Paperline_Recruiter_Case_Study.pdf",
);
assert.ok(fs.existsSync(fixture), "Parser fixture is missing");

async function main() {
  const buffer = fs.readFileSync(fixture);
  const parsed = await parsePdf(buffer);
  assert.ok(parsed.pageCount > 0, "PDF text parser returned no pages");
  assert.ok(parsed.text.length > 100, "PDF text parser returned too little text");

  const rendered = await renderPdfPages(buffer, 1);
  assert.equal(rendered.pages.length, 1, "PDF renderer did not return one page");
  assert.ok(rendered.pages[0].image.length > 1000, "Rendered PNG is unexpectedly small");
  assert.equal(rendered.pages[0].image.subarray(1, 4).toString("ascii"), "PNG");

  console.log(
    `✓ Parser runtime validated (${parsed.pageCount} text pages; ${rendered.pages[0].image.length} rendered bytes)`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
