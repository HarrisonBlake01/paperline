// =====================================================================
// OpenAI client + model defaults.
// =====================================================================

import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const MODELS = {
  extraction: process.env.OPENAI_EXTRACTION_MODEL ?? "gpt-5.4",
  chat: process.env.OPENAI_CHAT_MODEL ?? "gpt-5.4",
  embedding: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-large",
};
