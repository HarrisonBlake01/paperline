// =====================================================================
// AI template generation — infer a reusable extraction schema from a doc.
// =====================================================================

import { getOpenAI, MODELS } from "@/lib/openai";
import { TemplateCreateInput, normalizeTemplateInput } from "@/lib/templates/validation";
import type { TemplateSchema } from "@/lib/types";

const MAX_DOC_CHARS = 45_000;
const COST_USD_PER_M_PROMPT = 2.5;
const COST_USD_PER_M_COMPLETION = 10;

export interface GeneratedTemplateRun {
  name: string;
  description: string | null;
  docType: string;
  schema: TemplateSchema;
  promptTokens: number;
  completionTokens: number;
  costCents: number;
  model: string;
}

function buildPrompt(filename: string, docType: string | null, text: string) {
  return [
    "You are designing a reusable document extraction template for a SaaS app called Paperline.",
    "Given one uploaded document, infer the most useful reusable schema a non-technical customer would want.",
    "Do not extract values. Define field names and field types only.",
    "Prefer 6-12 high-value fields. Avoid overly-specific fields that only apply to this exact document unless clearly important.",
    "Use simple snake_case field names that a business user would understand.",
    "Use only these field types: text, number, date, currency, boolean, list.",
    "Mark fields required only when they are central to this document type.",
    "Return ONLY JSON with this shape:",
    '{ "name": "Template name", "description": "What this extracts", "doc_type": "snake_case_type", "fields": [{ "name": "field_name", "type": "text", "required": true, "description": "What to look for" }] }',
    "",
    `Filename: ${filename}`,
    `Detected type: ${docType ?? "unknown"}`,
    "Document excerpt:",
    "----",
    text.slice(0, MAX_DOC_CHARS),
    "----",
  ].join("\n");
}

export async function generateTemplateFromDocument(opts: {
  filename: string;
  docType: string | null;
  text: string;
}): Promise<GeneratedTemplateRun> {
  const openai = getOpenAI();
  const prompt = buildPrompt(opts.filename, opts.docType, opts.text);

  const resp = await openai.chat.completions.create({
    model: MODELS.extraction,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You create concise, reusable document extraction templates. You only emit valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const input = TemplateCreateInput.parse(parsed);
  const normalized = normalizeTemplateInput(input);
  const promptTokens = resp.usage?.prompt_tokens ?? 0;
  const completionTokens = resp.usage?.completion_tokens ?? 0;
  const costCents = Math.round(
    ((promptTokens * COST_USD_PER_M_PROMPT +
      completionTokens * COST_USD_PER_M_COMPLETION) /
      1_000_000) *
      100,
  );

  return {
    name: normalized.name,
    description: normalized.description,
    docType: normalized.doc_type,
    schema: normalized.schema,
    promptTokens,
    completionTokens,
    costCents,
    model: MODELS.extraction,
  };
}
