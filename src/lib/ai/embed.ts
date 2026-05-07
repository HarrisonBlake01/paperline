// =====================================================================
// Embedding helpers — wrap OpenAI embeddings with batching.
// =====================================================================

import { getOpenAI, MODELS } from "@/lib/openai";

const BATCH_SIZE = 96; // OpenAI hard limit is 2048 inputs per request, but
                       // we cap lower so latency stays reasonable.

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const resp = await openai.embeddings.create({
      model: MODELS.embedding,
      input: batch,
    });
    for (const item of resp.data) {
      out.push(item.embedding);
    }
  }

  return out;
}
