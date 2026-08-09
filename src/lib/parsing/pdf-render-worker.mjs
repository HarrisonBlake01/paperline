import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

const decodeAllocationLimitBytes = workerData?.decodeAllocationLimitBytes;
const pageNumber = workerData?.pageNumber;
if (
  !Number.isSafeInteger(decodeAllocationLimitBytes) ||
  decodeAllocationLimitBytes < 64 * 1024 ||
  decodeAllocationLimitBytes > 32 * 1024 * 1024 ||
  !Number.isSafeInteger(pageNumber) ||
  pageNumber < 1 ||
  pageNumber > 10
) {
  throw new Error("pdf_render_worker_data_invalid");
}

Object.defineProperty(globalThis, "__paperlinePdfDecodeAllocationLimitBytes", {
  value: decodeAllocationLimitBytes,
  configurable: false,
  enumerable: false,
  writable: false,
});

const require = createRequire(import.meta.url);
const pdfjsRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
const standardFontDataUrl = `${path.join(pdfjsRoot, "standard_fonts")}${path.sep}`;
const pdfjsWorkerSrc = pathToFileURL(
  path.join(pdfjsRoot, "legacy", "build", "pdf.worker.mjs"),
).href;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
const { createCanvas } = await import("@napi-rs/canvas");

const PDF_RENDER_WIDTH = 2000;
const MAX_RENDER_DIMENSION = 8192;
const MAX_RENDER_PIXELS = 16_000_000;

function asStableError(error) {
  if (!(error instanceof Error)) return "pdf_render_failed";
  const message = error.message || "";
  if (message.includes("pdf_decoded_stream_limit_exceeded")) {
    return "pdf_decoded_stream_limit_exceeded";
  }
  if (
    message === "pdf_page_dimensions_exceeded" ||
    message === "pdf_render_page_out_of_range"
  ) {
    return message;
  }
  return "pdf_render_failed";
}

async function renderPage(data) {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    isEvalSupported: false,
    useWorkerFetch: false,
    standardFontDataUrl,
  });
  try {
    const document = await loadingTask.promise;
    if (pageNumber > document.numPages) {
      throw new Error("pdf_render_page_out_of_range");
    }
    const page = await document.getPage(pageNumber);
    try {
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = PDF_RENDER_WIDTH / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0 ||
        width > MAX_RENDER_DIMENSION ||
        height > MAX_RENDER_DIMENSION ||
        width * height > MAX_RENDER_PIXELS
      ) {
        throw new Error("pdf_page_dimensions_exceeded");
      }
      const canvas = createCanvas(width, height);
      const canvasContext = canvas.getContext("2d");
      await page.render({ canvas, canvasContext, viewport }).promise;
      const png = canvas.toBuffer("image/png");
      const bytes = Uint8Array.from(png);
      return { image: bytes, totalPages: document.numPages };
    } finally {
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
}

if (!parentPort) throw new Error("pdf_render_worker_parent_missing");
parentPort.once("message", async (data) => {
  try {
    const result = await renderPage(data);
    parentPort.postMessage(
      { ok: true, result },
      [result.image.buffer],
    );
  } catch (error) {
    parentPort.postMessage({ ok: false, error: asStableError(error) });
  } finally {
    setImmediate(() => parentPort.close());
  }
});
