import { getOpenAI, MODELS } from "@/lib/openai";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envEnum<T extends string>(
  name: string,
  fallback: T,
  allowed: readonly T[],
): T {
  const raw = process.env[name];
  if (!raw) return fallback;
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export const OCR_LIMITS = {
  // Max number of pages we'll OCR from a single PDF.
  maxPdfPages: envInt("PAPERLINE_OCR_MAX_PDF_PAGES", 10),
  // OpenAI vision detail level: low | high | auto.
  imageDetail: envEnum<"low" | "high" | "auto">(
    "PAPERLINE_OCR_IMAGE_DETAIL",
    "high",
    ["low", "high", "auto"],
  ),
  // Per-image attempts.
  maxAttempts: envInt("PAPERLINE_OCR_MAX_ATTEMPTS", 2),
  // Soft cap on concurrent vision calls.
  concurrency: envInt("PAPERLINE_OCR_CONCURRENCY", 3),
};

function mimeToDataUrl(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

const OCR_SYSTEM_PROMPT =
  "You perform OCR on document images. Return only the extracted text, preserving line breaks where helpful. Do not summarize, translate, or comment.";

const OCR_USER_PROMPT =
  "Extract all readable text from this document image. Return plain text only. If the image has no readable text, return an empty response.";

async function callVisionOcr(dataUrl: string): Promise<string> {
  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: MODELS.extraction,
    temperature: 0,
    messages: [
      { role: "system", content: OCR_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: OCR_USER_PROMPT },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: OCR_LIMITS.imageDetail },
          },
        ],
      },
    ],
  });

  return (resp.choices[0]?.message?.content ?? "").trim();
}

export async function extractTextFromImageDataUrl(dataUrl: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= OCR_LIMITS.maxAttempts; attempt++) {
    try {
      return await callVisionOcr(dataUrl);
    } catch (err) {
      lastErr = err;
      const wait = 250 * attempt;
      console.warn(
        `[ocr] attempt ${attempt} failed, retrying in ${wait}ms: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("OCR failed");
}

export async function extractTextFromImageBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  return extractTextFromImageDataUrl(mimeToDataUrl(mimeType, buffer));
}

/**
 * Run a worker fn over a list with bounded concurrency.
 * Preserves input order in the output array.
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency = OCR_LIMITS.concurrency,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const limit = Math.max(1, Math.min(concurrency, items.length));

  async function runOne(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runOne()));
  return results;
}
