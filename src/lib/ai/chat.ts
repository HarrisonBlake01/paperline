// =====================================================================
// Document chat with retrieval + citations.
// =====================================================================

import { createServiceClient } from "@/lib/supabase/server";
import { getOpenAI, MODELS } from "@/lib/openai";
import { embedTexts } from "@/lib/ai/embed";
import type { ChatCitation } from "@/lib/types";

const TOP_K = 6;

export interface ChatTurnResult {
  answer: string;
  citations: ChatCitation[];
  promptTokens: number;
  completionTokens: number;
}

export async function chatWithDocuments(opts: {
  workspaceId: string;
  documentIds: string[];
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<ChatTurnResult> {
  const sb = createServiceClient();
  const openai = getOpenAI();

  // 1. Embed question
  const [embedding] = await embedTexts([opts.question]);

  // 2. Retrieve top-k chunks across selected docs
  // We rely on a SQL function `match_chunks` defined in a future migration.
  // For now, fall back to a simple ordered query if rpc is missing.
  const { data: matches, error } = await sb.rpc("match_chunks", {
    query_embedding: embedding,
    workspace: opts.workspaceId,
    document_ids: opts.documentIds,
    match_count: TOP_K,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  type MatchRow = {
    id: string;
    document_id: string;
    page_number: number | null;
    text: string;
    similarity: number;
  };
  const rows = (matches ?? []) as MatchRow[];

  const contextBlock = rows
    .map(
      (r, i) =>
        `[${i + 1}] (doc ${r.document_id} · page ${r.page_number ?? "?"})\n${r.text}`,
    )
    .join("\n\n");

  // 3. Build messages
  const system = [
    "You are Paperline, an AI assistant that answers questions strictly from the provided document excerpts.",
    "Cite sources inline using [1], [2], etc. matching the numbered excerpts.",
    "If the answer is not in the excerpts, say you don't have enough information.",
    "Be concise and factual.",
  ].join("\n");

  const user = [
    "Excerpts:",
    contextBlock || "(no excerpts found)",
    "",
    `Question: ${opts.question}`,
  ].join("\n");

  const resp = await openai.chat.completions.create({
    model: MODELS.chat,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      ...(opts.history?.slice(-6) ?? []),
      { role: "user", content: user },
    ],
  });

  const answer = resp.choices[0]?.message?.content ?? "";

  const citations: ChatCitation[] = rows.map((r) => ({
    chunk_id: r.id,
    page: r.page_number,
    snippet: r.text.slice(0, 220),
  }));

  return {
    answer,
    citations,
    promptTokens: resp.usage?.prompt_tokens ?? 0,
    completionTokens: resp.usage?.completion_tokens ?? 0,
  };
}
