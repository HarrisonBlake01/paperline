import { createRequire } from "node:module";
import {
  OCR_LIMITS,
  extractTextFromImageBuffer,
  runWithConcurrency,
} from "@/lib/ai/ocr";

const nodeRequire = createRequire(`${process.cwd()}/package.json`);

export interface ParsedOcrPdf {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
  truncated: boolean;
  totalPages: number;
}

export interface RenderedPdfPage {
  page: number;
  image: Buffer;
}

export async function renderPdfPages(
  buffer: Buffer,
  pageLimit = OCR_LIMITS.maxPdfPages,
): Promise<{ pages: RenderedPdfPage[]; totalPages: number }> {
  const { PDFParse } = await import("pdf-parse");
  const { getPath } = nodeRequire("pdf-parse/worker") as {
    getPath: () => string;
  };
  PDFParse.setWorker(getPath());
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const screenshots = await parser.getScreenshot({
      first: pageLimit,
      desiredWidth: 2000,
      imageBuffer: true,
      imageDataUrl: false,
    });
    return {
      pages: screenshots.pages.map((page) => ({
        page: page.pageNumber,
        image: Buffer.from(page.data),
      })),
      totalPages: screenshots.total,
    };
  } finally {
    await parser.destroy();
  }
}

export async function parseScannedPdfWithOcr(
  buffer: Buffer,
  totalPages: number,
): Promise<ParsedOcrPdf> {
  const limit = OCR_LIMITS.maxPdfPages;
  const truncated = totalPages > limit;
  const rendered = await renderPdfPages(buffer, limit);
  const ocrResults = await runWithConcurrency(rendered.pages, async (page) => {
    return extractTextFromImageBuffer(page.image, "image/png");
  });

  const pages = ocrResults.map((text, index) => ({
    page: rendered.pages[index]?.page ?? index + 1,
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
}
