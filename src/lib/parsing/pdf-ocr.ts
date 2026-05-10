import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  OCR_LIMITS,
  extractTextFromImageBuffer,
  runWithConcurrency,
} from "@/lib/ai/ocr";

const execFileAsync = promisify(execFile);

const SWIFT_RENDER_SCRIPT = String.raw`
import Foundation
import PDFKit
import AppKit

let pdfPath = CommandLine.arguments[1]
let outputDir = CommandLine.arguments[2]
let maxPages = Int(CommandLine.arguments[3]) ?? 10

guard let document = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
  fputs("Could not open PDF\n", stderr)
  exit(1)
}

let total = min(document.pageCount, maxPages)
for i in 0..<total {
  guard let page = document.page(at: i) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let maxDimension: CGFloat = 2000
  let scale = max(bounds.width, bounds.height) > 0 ? maxDimension / max(bounds.width, bounds.height) : 1
  let size = NSSize(width: max(1, bounds.width * scale), height: max(1, bounds.height * scale))
  let image = page.thumbnail(of: size, for: .mediaBox)
  guard let tiff = image.tiffRepresentation,
        let rep = NSBitmapImageRep(data: tiff),
        let png = rep.representation(using: .png, properties: [:]) else {
    continue
  }
  let name = String(format: "page-%03d.png", i + 1)
  let url = URL(fileURLWithPath: outputDir).appendingPathComponent(name)
  try png.write(to: url)
}
`;

export interface ParsedOcrPdf {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
  truncated: boolean;
  totalPages: number;
}

export async function parseScannedPdfWithOcr(
  buffer: Buffer,
  totalPages: number,
): Promise<ParsedOcrPdf> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "paperline-pdf-ocr-"));
  const pdfPath = path.join(tempDir, "input.pdf");
  const outputDir = path.join(tempDir, "pages");

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(pdfPath, buffer);

  const limit = OCR_LIMITS.maxPdfPages;
  const truncated = totalPages > limit;

  try {
    await execFileAsync(
      "swift",
      ["-e", SWIFT_RENDER_SCRIPT, pdfPath, outputDir, String(limit)],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const files = (await fs.readdir(outputDir))
      .filter((name) => name.endsWith(".png"))
      .sort();

    const ocrResults = await runWithConcurrency(files, async (file) => {
      const imageBuffer = await fs.readFile(path.join(outputDir, file));
      return extractTextFromImageBuffer(imageBuffer, "image/png");
    });

    const pages = ocrResults.map((text, index) => ({
      page: index + 1,
      text: text.trim(),
    }));

    const combined = pages.map((p) => p.text).filter(Boolean).join("\n\n");
    return {
      text: combined,
      pageCount: pages.length,
      pages,
      truncated,
      totalPages,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
