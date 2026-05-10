// =====================================================================
// Auto-classify a document into one of our doc_types.
// =====================================================================

import { getOpenAI, MODELS } from "@/lib/openai";
import type { DocType } from "@/lib/types";

const ALLOWED_DOC_TYPES: DocType[] = [
  "invoice",
  "receipt",
  "contract",
  "agreement",
  "resume",
  "report",
  "letter",
  "email",
  "memo",
  "form",
  "manual",
  "worksheet",
  "presentation",
  "spreadsheet",
  "note",
  "other",
];

const PROMPT = `You classify business documents. Read the excerpt and respond
with exactly one of: ${ALLOWED_DOC_TYPES.join(", ")}.

Definitions:
- invoice: bill or statement requesting payment with vendor + line items
- receipt: proof of completed payment / purchase
- contract: formal legal agreement with clauses and signatures
- agreement: less formal arrangement (NDA, MOU, terms)
- resume: a person's CV or professional history
- report: long-form analytical or informational document
- letter: personal or business correspondence addressed to someone
- email: an email message or thread
- memo: internal short-form announcement
- form: structured fillable document (application, intake, tax form)
- manual: instructions, guide, how-to, technical documentation
- worksheet: educational or task-style document with prompts/questions
- presentation: slide deck or speaker notes
- spreadsheet: tabular data export
- note: short notes, jotted ideas, meeting notes
- other: clearly none of the above

Pick the single best match. Respond with ONLY the single word.`;

export async function classifyDocument(text: string): Promise<DocType> {
  const openai = getOpenAI();
  const excerpt = text.slice(0, 4000);

  console.log(
    `[classifyDocument] start ${JSON.stringify({
      model: MODELS.extraction,
      excerptLength: excerpt.length,
      excerptPreview: excerpt.slice(0, 200),
    })}`,
  );

  const resp = await openai.chat.completions.create({
    model: MODELS.extraction,
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: excerpt },
    ],
  });

  const raw = (resp.choices[0]?.message?.content ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, " ");

  // Prefer exact whole-word match; fall back to substring.
  const tokens = raw.split(/\s+/).filter(Boolean);
  const exact = ALLOWED_DOC_TYPES.find((d) => tokens.includes(d));
  const fuzzy = exact ?? ALLOWED_DOC_TYPES.find((d) => raw.includes(d));

  console.log(
    `[classifyDocument] result ${JSON.stringify({
      raw,
      matched: fuzzy ?? null,
      finishReason: resp.choices[0]?.finish_reason ?? null,
      usage: resp.usage ?? null,
    })}`,
  );

  if (!fuzzy) {
    console.warn(
      `[classifyDocument] could not parse model output ${JSON.stringify({ raw })}`,
    );
  }
  return fuzzy ?? "other";
}
