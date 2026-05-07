// =====================================================================
// Structured extraction — given a template schema and document text,
// return JSON matching the schema with per-field confidence scores.
// =====================================================================

import { getOpenAI, MODELS } from "@/lib/openai";
import type {
  ExtractionResult,
  TemplateField,
  TemplateSchema,
} from "@/lib/types";

function fieldDescriptionLine(f: TemplateField): string {
  const req = f.required ? " (required)" : "";
  const desc = f.description ? ` — ${f.description}` : "";
  return `- ${f.name} (${f.type})${req}${desc}`;
}

function buildPrompt(schema: TemplateSchema, docExcerpt: string): string {
  const fieldList = schema.fields.map(fieldDescriptionLine).join("\n");
  return [
    "You are an expert document analyst. Extract the following fields from the document.",
    "",
    "Fields:",
    fieldList,
    "",
    "Rules:",
    "- Return ONLY a JSON object matching the schema below.",
    "- For each field, include a confidence score from 0 to 100 based on how clearly it appears in the source.",
    "- If a field is not present, set value to null and confidence to 0.",
    "- For list fields, return an array; for date fields use ISO 8601 (YYYY-MM-DD).",
    "- Do not invent data.",
    "",
    "Output schema:",
    '{ "fields": { "<field_name>": { "value": <value|null>, "confidence": <0-100> }, ... } }',
    "",
    "Document:",
    "----",
    docExcerpt,
    "----",
  ].join("\n");
}

const MAX_DOC_CHARS = 80_000; // ~20k tokens, well within context

export interface ExtractionRunResult {
  result: ExtractionResult;
  promptTokens: number;
  completionTokens: number;
  costCents: number;
  model: string;
}

// Rough cost estimate (USD per 1M tokens) — easy to tune later.
const COST_USD_PER_M_PROMPT = 2.5;
const COST_USD_PER_M_COMPLETION = 10;

export async function extractStructured(opts: {
  text: string;
  schema: TemplateSchema;
}): Promise<ExtractionRunResult> {
  const openai = getOpenAI();
  const docExcerpt = opts.text.slice(0, MAX_DOC_CHARS);
  const prompt = buildPrompt(opts.schema, docExcerpt);

  const resp = await openai.chat.completions.create({
    model: MODELS.extraction,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a precise extraction engine. You only emit valid JSON matching the requested schema.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? "{}";
  let parsed: ExtractionResult;
  try {
    parsed = JSON.parse(raw) as ExtractionResult;
  } catch {
    parsed = { fields: {} };
  }
  if (!parsed.fields) parsed.fields = {};

  const promptTokens = resp.usage?.prompt_tokens ?? 0;
  const completionTokens = resp.usage?.completion_tokens ?? 0;
  const costCents = Math.round(
    ((promptTokens * COST_USD_PER_M_PROMPT +
      completionTokens * COST_USD_PER_M_COMPLETION) /
      1_000_000) *
      100,
  );

  return {
    result: parsed,
    promptTokens,
    completionTokens,
    costCents,
    model: MODELS.extraction,
  };
}
