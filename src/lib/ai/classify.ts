// =====================================================================
// Auto-classify a document into one of our doc_types.
// =====================================================================

import { getOpenAI, MODELS } from "@/lib/openai";
import type { DocType } from "@/lib/types";

const PROMPT = `You classify business documents. Read the excerpt and respond
with exactly one of: invoice, contract, resume, report, other.

Definitions:
- invoice: bill or statement requesting payment, includes vendor + line items
- contract: legal agreement between two or more parties
- resume: a person's CV / professional history
- report: a long-form analytical or informational document
- other: anything else

Respond with ONLY the single word.`;

export async function classifyDocument(text: string): Promise<DocType> {
  const openai = getOpenAI();
  const excerpt = text.slice(0, 4000);

  const resp = await openai.chat.completions.create({
    model: MODELS.extraction,
    temperature: 0,
    max_tokens: 5,
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: excerpt },
    ],
  });

  const raw = (resp.choices[0]?.message?.content ?? "").trim().toLowerCase();
  const allowed: DocType[] = ["invoice", "contract", "resume", "report", "other"];
  const match = allowed.find((d) => raw.startsWith(d));
  return match ?? "other";
}
