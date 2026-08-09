import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

const decodeAllocationLimitBytes = workerData?.decodeAllocationLimitBytes;
if (
  !Number.isSafeInteger(decodeAllocationLimitBytes) ||
  decodeAllocationLimitBytes < 64 * 1024 ||
  decodeAllocationLimitBytes > 32 * 1024 * 1024
) {
  throw new Error("pdf_decode_budget_invalid");
}

Object.defineProperty(globalThis, "__paperlinePdfDecodeAllocationLimitBytes", {
  value: decodeAllocationLimitBytes,
  configurable: false,
  enumerable: false,
  writable: false,
});

// This file is explicitly traced and launched unbundled. Runtime package
// resolution therefore remains ordinary Node resolution and is not rewritten
// to a Turbopack module identifier.
const require = createRequire(import.meta.url);
const pdfjsRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
const standardFontDataUrl = `${path.join(pdfjsRoot, "standard_fonts")}${path.sep}`;
const pdfjsWorkerSrc = pathToFileURL(
  path.join(pdfjsRoot, "legacy", "build", "pdf.worker.mjs"),
).href;

// Import PDF.js only after the private decode budget is installed so the
// patched DecodeStream path can enforce it during expansion.
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

const MAX_PDF_TEXT_PAGES = 250;
const MAX_PDF_TEXT_CHARACTERS = 200_000;

function asStableError(error) {
  if (!(error instanceof Error)) return "pdf_parse_failed";
  const message = error.message || "";
  if (message.includes("pdf_decoded_stream_limit_exceeded")) {
    return "pdf_decoded_stream_limit_exceeded";
  }
  if (
    message === "pdf_page_limit_exceeded" ||
    message === "pdf_text_limit_exceeded"
  ) {
    return message;
  }
  return "pdf_parse_failed";
}

async function parsePdf(data) {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    isEvalSupported: false,
    useWorkerFetch: false,
    standardFontDataUrl,
  });

  try {
    const document = await loadingTask.promise;
    if (document.numPages > MAX_PDF_TEXT_PAGES) {
      throw new Error("pdf_page_limit_exceeded");
    }

    const pages = [];
    let totalCharacters = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const stream = page.streamTextContent();
        const reader = stream.getReader();
        const pieces = [];
        let pageCharacters = 0;
        let completed = false;
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) {
              completed = true;
              break;
            }
            for (const item of chunk.value.items) {
              if (!("str" in item)) continue;
              const piece = `${item.str}${item.hasEOL ? "\n" : " "}`;
              pageCharacters += piece.length;
              if (totalCharacters + pageCharacters > MAX_PDF_TEXT_CHARACTERS) {
                throw new Error("pdf_text_limit_exceeded");
              }
              pieces.push(piece);
            }
          }
        } finally {
          if (!completed) await reader.cancel("pdf_text_limit_reached").catch(() => {});
          reader.releaseLock();
        }

        const text = pieces
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/[ \t]{2,}/g, " ")
          .trim();
        totalCharacters += pageCharacters;
        pages.push({ page: pageNumber, text });
      } finally {
        page.cleanup();
      }
    }

    return {
      text: pages.map((page) => page.text).filter(Boolean).join("\n\n"),
      pageCount: document.numPages,
      pages,
    };
  } finally {
    await loadingTask.destroy();
  }
}

if (!parentPort) throw new Error("pdf_worker_parent_missing");
parentPort.once("message", async (data) => {
  try {
    parentPort.postMessage({ ok: true, result: await parsePdf(data) });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: asStableError(error) });
  } finally {
    setImmediate(() => parentPort.close());
  }
});
