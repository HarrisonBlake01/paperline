import fs from "node:fs";
import path from "node:path";
import type {
  ExtractionResult,
  TemplateField,
  TemplateSchema,
} from "../src/lib/types";

type EvalCase = {
  id: string;
  document: string;
  schema: TemplateSchema;
  expected: ExtractionResult;
};

type PredictionFile = Record<string, ExtractionResult>;

type Counts = { tp: number; fp: number; fn: number };

const ROOT = process.cwd();
const CASES_PATH = path.join(ROOT, "evals/document-extraction/cases.json");
const DEFAULT_PREDICTIONS_PATH = path.join(
  ROOT,
  "evals/document-extraction/sample-predictions.json",
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function canonicalExact(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeText(value: unknown): string {
  return String(value).normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: unknown): string | null {
  const text = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  const named = /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i.exec(text);
  if (!named || !months[named[1].toLowerCase()]) return null;
  return `${named[3]}-${months[named[1].toLowerCase()]}-${named[2].padStart(2, "0")}`;
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const text = normalizeText(value);
  if (["true", "yes", "y", "1"].includes(text)) return true;
  if (["false", "no", "n", "0"].includes(text)) return false;
  return null;
}

function normalizeValue(type: TemplateField["type"], value: unknown): unknown {
  if (value === null || value === undefined || value === "") return null;
  switch (type) {
    case "text":
      return normalizeText(value);
    case "number":
    case "currency":
      return normalizeNumber(value);
    case "date":
      return normalizeDate(value);
    case "boolean":
      return normalizeBoolean(value);
    case "list": {
      const values = Array.isArray(value) ? value : [value];
      return [...new Set(values.map(normalizeText).filter(Boolean))].sort();
    }
  }
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : numerator / denominator;
}

function prf(counts: Counts) {
  const precision = ratio(counts.tp, counts.tp + counts.fp);
  const recall = ratio(counts.tp, counts.tp + counts.fn);
  return {
    precision,
    recall,
    f1: precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall),
  };
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function validateCases(cases: EvalCase[], predictions: PredictionFile): void {
  assert(Array.isArray(cases) && cases.length > 0, "Evaluation set must contain cases.");
  const ids = new Set<string>();
  for (const evalCase of cases) {
    assert(evalCase.id && !ids.has(evalCase.id), `Duplicate or empty case id: ${evalCase.id}`);
    ids.add(evalCase.id);
    assert(evalCase.document.trim(), `${evalCase.id} has no synthetic document text.`);
    assert(Array.isArray(evalCase.schema?.fields), `${evalCase.id} has no schema fields.`);
    assert(predictions[evalCase.id]?.fields, `Missing prediction for ${evalCase.id}.`);
    for (const field of evalCase.schema.fields) {
      assert(
        Object.hasOwn(evalCase.expected.fields, field.name),
        `${evalCase.id} is missing label for ${field.name}.`,
      );
    }
  }
  for (const id of Object.keys(predictions)) {
    assert(ids.has(id), `Prediction file contains unknown case id: ${id}.`);
  }
}

function main(): void {
  const predictionsPath = path.resolve(process.argv[2] ?? DEFAULT_PREDICTIONS_PATH);
  const cases = readJson<EvalCase[]>(CASES_PATH);
  const predictions = readJson<PredictionFile>(predictionsPath);
  validateCases(cases, predictions);

  let totalFields = 0;
  let exactMatches = 0;
  let normalizedMatches = 0;
  const presence: Counts = { tp: 0, fp: 0, fn: 0 };
  const listItems: Counts = { tp: 0, fp: 0, fn: 0 };

  for (const evalCase of cases) {
    const predictedFields = predictions[evalCase.id].fields;
    for (const field of evalCase.schema.fields) {
      totalFields += 1;
      const expected = evalCase.expected.fields[field.name]?.value ?? null;
      const predicted = predictedFields[field.name]?.value ?? null;
      const expectedPresent = expected !== null;
      const predictedPresent = predicted !== null;

      if (expectedPresent && predictedPresent) presence.tp += 1;
      else if (!expectedPresent && predictedPresent) presence.fp += 1;
      else if (expectedPresent && !predictedPresent) presence.fn += 1;

      if (canonicalExact(expected) === canonicalExact(predicted)) exactMatches += 1;
      if (
        expectedPresent === predictedPresent &&
        canonicalExact(normalizeValue(field.type, expected)) ===
          canonicalExact(normalizeValue(field.type, predicted))
      ) {
        normalizedMatches += 1;
      }

      if (field.type === "list") {
        const expectedItems = new Set((normalizeValue("list", expected) as string[]) ?? []);
        const predictedItems = new Set((normalizeValue("list", predicted) as string[]) ?? []);
        for (const item of predictedItems) {
          if (expectedItems.has(item)) listItems.tp += 1;
          else listItems.fp += 1;
        }
        for (const item of expectedItems) {
          if (!predictedItems.has(item)) listItems.fn += 1;
        }
      }
    }
  }

  const presenceScores = prf(presence);
  const listScores = prf(listItems);
  console.log(`Paperline document-extraction evaluation`);
  console.log(`Cases: ${cases.length} | Labeled fields: ${totalFields}`);
  console.log(`Predictions: ${path.relative(ROOT, predictionsPath)}`);
  console.log(`Exact field accuracy:      ${percent(ratio(exactMatches, totalFields))} (${exactMatches}/${totalFields})`);
  console.log(`Normalized field accuracy: ${percent(ratio(normalizedMatches, totalFields))} (${normalizedMatches}/${totalFields})`);
  console.log(`Presence precision/recall/F1: ${percent(presenceScores.precision)} / ${percent(presenceScores.recall)} / ${percent(presenceScores.f1)} (TP=${presence.tp}, FP=${presence.fp}, FN=${presence.fn})`);
  console.log(`List-item precision/recall/F1: ${percent(listScores.precision)} / ${percent(listScores.recall)} / ${percent(listScores.f1)} (TP=${listItems.tp}, FP=${listItems.fp}, FN=${listItems.fn})`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
