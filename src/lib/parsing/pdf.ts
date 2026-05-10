// =====================================================================
// PDF text extraction.
// =====================================================================
// Uses `pdf-parse` for fast text extraction.  When a PDF is image-only
// (scan), the returned text will be near-empty; we hand off to the OCR
// path in that case (planned: tesseract.js or AWS Textract).
// =====================================================================

import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

export interface ParsedPdf {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
}

/**
 * Parse a PDF buffer into per-page text using pdf-parse v2's class API.
 */
const pdfPackageDir = fs.realpathSync(path.join(process.cwd(), "node_modules", "pdf-parse"));
const pdfWorkerPath = path.join(pdfPackageDir, "dist", "worker", "pdf.worker.mjs");

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  PDFParse.setWorker(pdfWorkerPath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
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
