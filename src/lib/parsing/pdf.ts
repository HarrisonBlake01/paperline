// =====================================================================
// PDF text extraction.
// =====================================================================
// Untrusted PDF decoding runs in a dedicated, traced source worker with a
// patched PDF.js decoded-stream allocation budget. The worker resolves its
// own external package paths at runtime, outside Turbopack's compiled chunks.
// =====================================================================

import path from "node:path";
import { Worker } from "node:worker_threads";

export interface ParsedPdf {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
}

interface PdfWorkerSuccess {
  ok: true;
  result: ParsedPdf;
}

interface PdfWorkerFailure {
  ok: false;
  error: string;
}

type PdfWorkerMessage = PdfWorkerSuccess | PdfWorkerFailure;

const PDF_PARSE_DEADLINE_MS = 10_000;
const PDF_WORKER_OLD_HEAP_MB = 192;
const PDF_WORKER_YOUNG_HEAP_MB = 32;
export const PDF_DECODE_ALLOCATION_BUDGET_BYTES = 32 * 1024 * 1024;

function resolvePdfWorkerPath(): string {
  // Avoid a statically analyzable Worker specifier so Turbopack leaves the
  // explicitly traced source worker unbundled.
  return path.join(
    process.cwd(),
    "src",
    "lib",
    "parsing",
    "pdf-text-worker.mjs",
  );
}

function workerFailureCode(error: unknown): string {
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "ERR_WORKER_OUT_OF_MEMORY"
  ) {
    return "pdf_resource_limit_exceeded";
  }
  return "pdf_parse_failed";
}

/** Parse a PDF buffer inside a hard-timeout worker with a decoded-stream budget. */
export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const workerOptions = {
    name: "paperline-pdf-parser",
    workerData: {
      decodeAllocationLimitBytes: PDF_DECODE_ALLOCATION_BUDGET_BYTES,
    },
    resourceLimits: {
      maxOldGenerationSizeMb: PDF_WORKER_OLD_HEAP_MB,
      maxYoungGenerationSizeMb: PDF_WORKER_YOUNG_HEAP_MB,
      stackSizeMb: 4,
    },
  };
  // Turbopack rewrites direct `new Worker(path, options)` calls into bundled
  // worker chunks even when ignore comments are present. Reflective
  // construction preserves the explicitly traced source path and ordinary
  // Node worker_threads behavior in production.
  const worker = Reflect.construct(Worker, [
    resolvePdfWorkerPath(),
    workerOptions,
  ]) as Worker;
  const bytes = Uint8Array.from(buffer);

  return new Promise<ParsedPdf>((resolve, reject) => {
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
      finish(() => reject(new Error("pdf_parse_deadline_exceeded")));
    }, PDF_PARSE_DEADLINE_MS);

    worker.once("message", (message: PdfWorkerMessage) => {
      if (message.ok) {
        finish(() => resolve(message.result));
      } else {
        finish(() => reject(new Error(message.error)));
      }
    });
    worker.once("error", (error) => {
      finish(() => reject(new Error(workerFailureCode(error))));
    });
    worker.once("exit", (code) => {
      if (code !== 0) {
        finish(() => reject(new Error("pdf_resource_limit_exceeded")));
      }
      // A zero exit can race the final MessagePort delivery; keep the message
      // listener and hard deadline active rather than failing on exit 0 alone.
    });
    worker.postMessage(bytes.buffer, [bytes.buffer]);
  });
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
