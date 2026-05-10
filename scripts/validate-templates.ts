import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { TemplateCreateInput, normalizeTemplateInput } from "../src/lib/templates/validation";
import type { TemplateRow } from "../src/lib/types";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const EXPECTED_BUILT_INS = new Set(["Invoice", "Contract", "Resume", "Report"]);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateTemplate(template: TemplateRow) {
  assert(template.name, `Template ${template.id} is missing a name.`);
  assert(template.doc_type, `${template.name} is missing doc_type.`);
  assert(Array.isArray(template.schema?.fields), `${template.name} schema.fields must be an array.`);
  assert(template.schema.fields.length > 0, `${template.name} must define at least one field.`);

  const names = new Set<string>();
  for (const field of template.schema.fields) {
    assert(/^[a-z][a-z0-9_]*$/.test(field.name), `${template.name}.${field.name} must be snake_case.`);
    assert(!names.has(field.name), `${template.name} has duplicate field ${field.name}.`);
    names.add(field.name);
    assert(["text", "number", "date", "currency", "boolean", "list"].includes(field.type), `${template.name}.${field.name} has invalid type ${field.type}.`);
  }
}

async function main() {
  const customExample = TemplateCreateInput.parse({
    name: "Client Intake",
    description: "Extract client request details from intake docs.",
    doc_type: "client_intake",
    fields: [
      { name: "client_name", type: "text", required: true, description: "Client or company name." },
      { name: "requested_services", type: "list", required: true, description: "Services requested by the client." },
      { name: "deadline", type: "date", required: false, description: "Requested due date." },
    ],
  });
  normalizeTemplateInput(customExample);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("✓ Custom template validation passed");
    console.log("- Skipped live built-in template check: Supabase env vars are not set.");
    return;
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb
    .from("templates")
    .select("*")
    .eq("is_builtin", true)
    .order("name", { ascending: true });

  if (error) throw error;
  const templates = (data ?? []) as TemplateRow[];
  assert(templates.length >= 4, `Expected at least 4 built-in templates, found ${templates.length}.`);

  for (const expected of EXPECTED_BUILT_INS) {
    assert(templates.some((template) => template.name === expected), `Missing built-in template: ${expected}.`);
  }
  templates.forEach(validateTemplate);

  console.log(`✓ Validated ${templates.length} built-in templates`);
  console.log("✓ Custom template validation passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
