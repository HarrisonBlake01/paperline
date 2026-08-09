import path from "node:path";
import { Worker } from "node:worker_threads";
import { OCR_LIMITS, extractTextFromImageBuffer } from "@/lib/ai/ocr";

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

interface RenderWorkerSuccess {
  ok: true;
  result: { image: Uint8Array; totalPages: number };
}

interface RenderWorkerFailure {
  ok: false;
  error: string;
}

type RenderWorkerMessage = RenderWorkerSuccess | RenderWorkerFailure;

const PDF_RENDER_DEADLINE_MS = 15_000;
const PDF_RENDER_OLD_HEAP_MB = 192;
const PDF_RENDER_YOUNG_HEAP_MB = 32;
const PDF_RENDER_DECODE_BUDGET_BYTES = 32 * 1024 * 1024;

function resolvePdfRenderWorkerPath(): string {
  return path.join(
    process.cwd(),
    "src",
    "lib",
    "parsing",
    "pdf-render-worker.mjs",
  );
}

function renderWorkerFailureCode(error: unknown): string {
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "ERR_WORKER_OUT_OF_MEMORY"
  ) {
    return "pdf_render_resource_limit_exceeded";
  }
  return "pdf_render_failed";
}

async function renderPdfPage(
  buffer: Buffer,
  pageNumber: number,
): Promise<{ page: RenderedPdfPage; totalPages: number }> {
  const workerOptions = {
    name: `paperline-pdf-render-${pageNumber}`,
    workerData: {
      decodeAllocationLimitBytes: PDF_RENDER_DECODE_BUDGET_BYTES,
      pageNumber,
    },
    resourceLimits: {
      maxOldGenerationSizeMb: PDF_RENDER_OLD_HEAP_MB,
      maxYoungGenerationSizeMb: PDF_RENDER_YOUNG_HEAP_MB,
      stackSizeMb: 4,
    },
  };
  const worker = Reflect.construct(Worker, [
    resolvePdfRenderWorkerPath(),
    workerOptions,
  ]) as Worker;
  const bytes = Uint8Array.from(buffer);

  return await new Promise((resolve, reject) => {
    let settled = false;
    const finish = (operation: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.removeAllListeners();
      operation();
    };
    const timer = setTimeout(() => {
      void worker.terminate();
      finish(() => reject(new Error("pdf_render_deadline_exceeded")));
    }, PDF_RENDER_DEADLINE_MS);
    worker.once("message", (message: RenderWorkerMessage) => {
      if (!message.ok) {
        finish(() => reject(new Error(message.error)));
        return;
      }
      finish(() =>
        resolve({
          page: {
            page: pageNumber,
            image: Buffer.from(message.result.image),
          },
          totalPages: message.result.totalPages,
        }),
      );
    });
    worker.once("error", (error) => {
      finish(() => reject(new Error(renderWorkerFailureCode(error))));
    });
    worker.once("exit", (code) => {
      if (code !== 0) {
        finish(() => reject(new Error("pdf_render_resource_limit_exceeded")));
      }
    });
    worker.postMessage(bytes.buffer, [bytes.buffer]);
  });
}

export async function renderPdfPages(
  buffer: Buffer,
  pageLimit = OCR_LIMITS.maxPdfPages,
): Promise<{ pages: RenderedPdfPage[]; totalPages: number }> {
  const requestedPages = Number.isFinite(pageLimit)
    ? Math.max(0, Math.floor(pageLimit))
    : OCR_LIMITS.maxPdfPages;
  const limit = Math.min(OCR_LIMITS.maxPdfPages, requestedPages);
  if (limit === 0) return { pages: [], totalPages: 0 };

  const first = await renderPdfPage(buffer, 1);
  const count = Math.min(first.totalPages, limit);
  const pages = [first.page];
  for (let pageNumber = 2; pageNumber <= count; pageNumber += 1) {
    pages.push((await renderPdfPage(buffer, pageNumber)).page);
  }
  return { pages, totalPages: first.totalPages };
}

export async function parseScannedPdfWithOcr(
  buffer: Buffer,
  totalPages: number,
): Promise<ParsedOcrPdf> {
  const limit = Math.min(totalPages, OCR_LIMITS.maxPdfPages);
  const truncated = totalPages > OCR_LIMITS.maxPdfPages;
  const pages: { page: number; text: string }[] = [];

  for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
    const rendered = await renderPdfPage(buffer, pageNumber);
    pages.push({
      page: pageNumber,
      text: (await extractTextFromImageBuffer(rendered.page.image, "image/png")).trim(),
    });
  }

  return {
    text: pages.map((page) => page.text).filter(Boolean).join("\n\n"),
    pageCount: pages.length,
    pages,
    truncated,
    totalPages,
  };
}
