import { extractTextFromImageBuffer } from "@/lib/ai/ocr";

export interface ParsedImageDocument {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
}

export async function parseImageWithOcr(
  buffer: Buffer,
  mimeType: string,
): Promise<ParsedImageDocument> {
  const text = await extractTextFromImageBuffer(buffer, mimeType);
  return {
    text,
    pageCount: text ? 1 : 0,
    pages: [{ page: 1, text }],
  };
}
