export interface ParsedTextDocument {
  text: string;
  pageCount: number;
  pages: { page: number; text: string }[];
}

export function parsePlainText(buffer: Buffer): ParsedTextDocument {
  const text = buffer.toString("utf8").trim();
  return {
    text,
    pageCount: text ? 1 : 0,
    pages: [{ page: 1, text }],
  };
}
