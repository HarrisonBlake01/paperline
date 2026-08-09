import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { parsePdf, PDF_DECODE_ALLOCATION_BUDGET_BYTES } from "../src/lib/parsing/pdf";
import { renderPdfPages } from "../src/lib/parsing/pdf-ocr";

function buildSyntheticPdf(pageCount: number, mediaBox = "0 0 612 792"): Buffer {
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${Array.from(
    { length: pageCount },
    (_, index) => `${index + 3} 0 R`,
  ).join(" ")}] >>`;
  for (let index = 0; index < pageCount; index += 1) {
    objects[index + 3] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [${mediaBox}] >>`;
  }

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(body);
    body += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  body +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body);
}

function buildPdfFromObjects(objects: Buffer[]): Buffer {
  const parts = [Buffer.from("%PDF-1.4\n")];
  const offsets = [0];
  let length = parts[0].length;
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = length;
    const object = Buffer.concat([
      Buffer.from(`${index} 0 obj\n`),
      objects[index],
      Buffer.from("\nendobj\n"),
    ]);
    parts.push(object);
    length += object.length;
  }
  const xrefOffset = length;
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  parts.push(
    Buffer.from(
      xref +
        `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
        `startxref\n${xrefOffset}\n%%EOF\n`,
    ),
  );
  return Buffer.concat(parts);
}

function buildCompressedContentPdf(content: Buffer): Buffer {
  const compressed = zlib.deflateSync(content, { level: 9 });
  return buildPdfFromObjects([
    Buffer.alloc(0),
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Count 1 /Kids [3 0 R] >>"),
    Buffer.from(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] " +
        "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    ),
    Buffer.concat([
      Buffer.from(`<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`),
      compressed,
      Buffer.from("\nendstream"),
    ]),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
  ]);
}

function buildCompressedTextPdf(characterCount: number): Buffer {
  const textChunk = "A".repeat(100);
  const showCount = Math.ceil(characterCount / textChunk.length);
  const content = Buffer.from(
    `BT /F1 12 Tf 72 720 Td ${Array.from(
      { length: showCount },
      () => `(${textChunk}) Tj 1 0 0 1 72 720 Tm`,
    ).join("\n")} ET`,
  );
  return buildCompressedContentPdf(content);
}

function buildCompressedOperatorPdf(decodedBytes: number): Buffer {
  const operator = "q 0 0 m 1 1 l S Q\n";
  const content = Buffer.from(operator.repeat(Math.ceil(decodedBytes / operator.length)));
  assert.ok(content.length >= decodedBytes);
  return buildCompressedContentPdf(content);
}

function buildCompressedGrayImagePdf(decodedBytes: number): Buffer {
  // Compact FlateDecode image XObject. Width is chosen so the raw gray sample
  // stream exceeds the decode budget once expanded, while the file stays small.
  const width = Math.max(1, Math.ceil(decodedBytes / 64));
  const height = 64;
  const raw = Buffer.alloc(width * height, 0x7f);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return buildPdfFromObjects([
    Buffer.alloc(0),
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Count 1 /Kids [3 0 R] >>"),
    Buffer.from(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] " +
        "/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>",
    ),
    Buffer.from("<< /Length 36 >>\nstream\nq 612 0 0 792 0 0 cm /Im0 Do Q\nendstream"),
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
          `/ColorSpace /DeviceGray /BitsPerComponent 8 /Length ${compressed.length} ` +
          `/Filter /FlateDecode >>\nstream\n`,
      ),
      compressed,
      Buffer.from("\nendstream"),
    ]),
  ]);
}

const fixture = path.join(
  process.cwd(),
  "docs/portfolio/Paperline_Recruiter_Case_Study.pdf",
);
assert.ok(fs.existsSync(fixture), "Parser fixture is missing");

async function main() {
  assert.equal(PDF_DECODE_ALLOCATION_BUDGET_BYTES, 32 * 1024 * 1024);

  const buffer = fs.readFileSync(fixture);
  const parsed = await parsePdf(buffer);
  assert.ok(parsed.pageCount > 0, "PDF text parser returned no pages");
  assert.ok(parsed.text.length > 100, "PDF text parser returned too little text");
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const pageContentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(parsed.pages.map((page) => normalize(page.text))))
    .digest("hex");
  assert.equal(
    pageContentHash,
    "9e5af615b3b74a20e15f891b59935024440f082ce501582c2f23e767fe71d5a6",
    "PDF.js upgrade changed normalized per-page fixture text",
  );

  const rendered = await renderPdfPages(buffer, 1);
  assert.equal(rendered.pages.length, 1, "PDF renderer did not return one page");
  assert.ok(rendered.pages[0].image.length > 1000, "Rendered PNG is unexpectedly small");
  assert.equal(rendered.pages[0].image.subarray(1, 4).toString("ascii"), "PNG");

  await assert.rejects(
    parsePdf(buildSyntheticPdf(251)),
    /pdf_page_limit_exceeded/,
  );
  await assert.rejects(
    renderPdfPages(buildSyntheticPdf(1, "0 0 1 100000"), 1),
    /pdf_page_dimensions_exceeded/,
  );

  // Bounded operator-only fixture for text-worker decode budget under the
  // production 32 MiB ceiling. Keep the on-disk PDF compact via FlateDecode.
  const operatorBomb = buildCompressedOperatorPdf(40 * 1024 * 1024);
  assert.ok(operatorBomb.length < 200_000, "Operator fixture is not compact");
  assert.doesNotMatch(operatorBomb.toString("latin1"), /Tj|TJ|\(/);
  const operatorStartedAt = Date.now();
  await assert.rejects(
    parsePdf(operatorBomb),
    /pdf_decoded_stream_limit_exceeded|pdf_resource_limit_exceeded/,
  );
  assert.ok(Date.now() - operatorStartedAt < 10_000, "Operator-budget rejection was too slow");

  // Compact image XObject for OCR/render isolate decode budget.
  const imageBomb = buildCompressedGrayImagePdf(
    PDF_DECODE_ALLOCATION_BUDGET_BYTES + 1024 * 1024,
  );
  assert.ok(imageBomb.length < 200_000, "Image fixture is not compact");
  const imageStartedAt = Date.now();
  await assert.rejects(
    renderPdfPages(imageBomb, 1),
    /pdf_decoded_stream_limit_exceeded/,
  );
  assert.ok(Date.now() - imageStartedAt < 10_000, "Image-budget rejection was too slow");

  const benign = buildCompressedTextPdf(40);
  const benignParsed = await parsePdf(benign);
  assert.ok(benignParsed.text.includes("A"));

  console.log(
    `✓ Parser runtime validated (${parsed.pageCount} text pages; ${rendered.pages[0].image.length} rendered bytes)`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
