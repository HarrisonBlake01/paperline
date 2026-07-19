// =====================================================================
// PDF text extraction.
// =====================================================================
// Uses `pdf-parse` for fast text extraction.  When a PDF is image-only
// (scan), the returned text will be near-empty; the pipeline hands off to
// the server-compatible PDF rendering and vision OCR path in pdf-ocr.ts.
// =====================================================================

import { createRequire } from "node:module";

const nodeRequire = createRequire(`${process.cwd()}/package.json`);

export interface ParsedPdf {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
}

/**
 * Parse a PDF buffer into per-page text using pdf-parse v2's class API.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  // Keep native canvas and PDF.js initialization out of route-module startup.
  // This prevents unrelated requests from crashing if a deployment is missing
  // an optional native artifact and lets the route return a bounded parse error.
  const { PDFParse } = await import("pdf-parse");
  const { getPath } = nodeRequire("pdf-parse/worker") as {
    getPath: () => string;
  };
  PDFParse.setWorker(getPath());
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const pageRecords = (result.pages ?? []).map((p, i) => ({
      page: p.num ?? i + 1,
      text: (p.text ?? "").trim(),
    }));
    const fullText =
      result.text ?? pageRecords.map((p) => p.text).join("\n\n");
    return {
      text: fullText.trim(),
      pageCount: result.total ?? pageRecords.length,
      pages: pageRecords,
    };
  } finally {
    await parser.destroy();
  }
}

const TEXT_DENSITY_THRESHOLD = 30; // chars per page

/**
 * If the average chars-per-page is below the threshold, treat as a scan.
 * The caller should then route the document through OCR.
 */
export function looksLikeScan(parsed: ParsedPdf): boolean {
  if (parsed.pageCount === 0) return false;
  const density = parsed.text.length / parsed.pageCount;
  return density < TEXT_DENSITY_THRESHOLD;
}
