import { z } from "zod";

export const TEMPLATE_FIELD_TYPES = [
  "text",
  "number",
  "date",
  "currency",
  "boolean",
  "list",
] as const;

export const TemplateFieldInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Field name is required.")
    .max(64, "Field name must be 64 characters or less.")
    .regex(/^[a-z][a-z0-9_]*$/, "Use snake_case, starting with a letter."),
  type: z.enum(TEMPLATE_FIELD_TYPES),
  required: z.boolean().default(false),
  description: z.string().trim().max(240).optional().or(z.literal("")),
});

export const TemplateCreateInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  doc_type: z.string().trim().min(2).max(40).regex(/^[a-z][a-z0-9_]*$/),
  fields: z.array(TemplateFieldInput).min(1).max(40),
});

export type TemplateCreateInput = z.infer<typeof TemplateCreateInput>;

export function normalizeTemplateInput(input: TemplateCreateInput) {
  const seen = new Set<string>();
  const fields = input.fields.map((field) => {
    const name = field.name.trim();
    if (seen.has(name)) {
      throw new Error(`Duplicate field name: ${name}`);
    }
    seen.add(name);
    return {
      name,
      type: field.type,
      required: Boolean(field.required),
      ...(field.description?.trim() ? { description: field.description.trim() } : {}),
    };
  });

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    doc_type: input.doc_type.trim(),
    schema: { fields },
  };
}
