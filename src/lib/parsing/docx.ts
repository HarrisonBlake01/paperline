import mammoth from "mammoth";

export interface ParsedDocx {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
}

export async function parseDocx(buffer: Buffer): Promise<ParsedDocx> {
  const { value } = await mammoth.extractRawText({ buffer });
  const text = value.trim();
  return {
    text,
    pageCount: text ? 1 : 0,
    pages: [{ page: 1, text }],
  };
}
