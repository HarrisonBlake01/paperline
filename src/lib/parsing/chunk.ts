// =====================================================================
// Text chunking for embeddings + retrieval.
// =====================================================================
// We chunk per-page so citations can pin to a specific page. Within a
// page we split on paragraph boundaries and pack chunks up to ~700
// tokens with ~100 token overlap.
// =====================================================================

const TOKEN_TARGET = 700;
const TOKEN_OVERLAP = 100;
const CHARS_PER_TOKEN = 4; // rough heuristic for English text

export interface PageInput {
  page: number;
  text: string;
}

export interface Chunk {
  chunkIndex: number;
  page: number;
  text: string;
  tokenCount: number;
}

function approxTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function chunkPages(pages: PageInput[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const { page, text } of pages) {
    if (!text) continue;

    const paragraphs = splitParagraphs(text);
    let buffer: string[] = [];
    let bufferTokens = 0;

    const flush = () => {
      if (buffer.length === 0) return;
      const joined = buffer.join("\n\n");
      chunks.push({
        chunkIndex: chunkIndex++,
        page,
        text: joined,
        tokenCount: approxTokens(joined),
      });

      // Leave overlap from the tail of the last chunk
      const tail: string[] = [];
      let tailTokens = 0;
      for (let i = buffer.length - 1; i >= 0 && tailTokens < TOKEN_OVERLAP; i--) {
        tail.unshift(buffer[i]);
        tailTokens += approxTokens(buffer[i]);
      }
      buffer = tail;
      bufferTokens = tailTokens;
    };

    for (const paragraph of paragraphs) {
      const t = approxTokens(paragraph);
      if (bufferTokens + t > TOKEN_TARGET && buffer.length > 0) {
        flush();
      }
      buffer.push(paragraph);
      bufferTokens += t;
    }

    if (buffer.length) flush();
  }

  return chunks;
}
