"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";
import { TEMPLATE_FIELD_TYPES } from "@/lib/templates/validation";
import type { TemplateField, TemplateRow } from "@/lib/types";

type DraftField = TemplateField & { id: string };

function newId() {
  return crypto.randomUUID();
}

function starterField(): DraftField {
  return {
    id: newId(),
    name: "document_title",
    type: "text",
    required: true,
    description: "The title or primary label for this document.",
  };
}

function fieldsFromTemplate(template?: TemplateRow): DraftField[] {
  if (!template) return [starterField()];
  return (template.schema.fields ?? []).map((field) => ({
    ...field,
    id: newId(),
    description: field.description ?? "",
  }));
}

export function CustomTemplateForm({
  template,
  onCancel,
}: {
  template?: TemplateRow;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(template);
  const [name, setName] = useState(template?.name ?? "");
  const [docType, setDocType] = useState(template?.doc_type ?? "custom_document");
  const [description, setDescription] = useState(template?.description ?? "");
  const [fields, setFields] = useState<DraftField[]>(fieldsFromTemplate(template));
  const [isPending, setIsPending] = useState(false);

  function updateField(id: string, patch: Partial<DraftField>) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }

  function addField() {
    setFields((current) => [
      ...current,
      {
        id: newId(),
        name: `field_${current.length + 1}`,
        type: "text",
        required: false,
        description: "",
      },
    ]);
  }

  function removeField(id: string) {
    setFields((current) => current.filter((field) => field.id !== id));
  }

  function resetCreateForm() {
    setName("");
    setDescription("");
    setDocType("custom_document");
    setFields([starterField()]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await fetch(isEditing ? `/api/templates/${template?.id}` : "/api/templates", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          doc_type: docType,
          fields: fields.map((field) => ({
            name: field.name,
            type: field.type,
            required: field.required,
            description: field.description ?? "",
          })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        template?: { name: string };
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.template) {
        toast.error(isEditing ? "Could not update template" : "Could not create template", {
          description: errorDescription(
            body.detail ?? body.error,
            "Check the field names and try again.",
          ),
        });
        return;
      }
      toast.success(isEditing ? "Template updated" : "Template created", {
        description: body.template.name,
      });
      if (isEditing) onCancel?.();
      else resetCreateForm();
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-pl-border bg-pl-surface p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
            {isEditing ? `Edit ${template?.name}` : "Create a custom template"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-pl-fg-dim">
            Advanced option: manually define fields. Basic users can open a document and choose “AI-create template from this document.”
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-pl-border px-4 py-2 text-sm hover:bg-pl-surface-2 disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--pl-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {isEditing ? <Save className="h-4 w-4" strokeWidth={1.75} /> : <Plus className="h-4 w-4" strokeWidth={1.75} />}
            {isPending ? "Saving..." : isEditing ? "Save changes" : "Create template"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <label className="block min-w-0 text-sm">
          <span className="text-pl-fg-dim">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Client intake form"
            required
            className="mt-2 w-full rounded-lg border border-pl-border bg-pl-bg px-3 py-2 outline-none focus:border-[var(--pl-accent)]"
          />
        </label>
        <label className="block min-w-0 text-sm">
          <span className="text-pl-fg-dim">Document type key</span>
          <input
            value={docType}
            onChange={(event) => setDocType(event.target.value)}
            placeholder="client_intake"
            required
            className="mt-2 w-full rounded-lg border border-pl-border bg-pl-bg px-3 py-2 font-mono text-xs outline-none focus:border-[var(--pl-accent)]"
          />
        </label>
        <label className="block min-w-0 text-sm">
          <span className="text-pl-fg-dim">Description</span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Extract client details, deadlines, and requested services."
            className="mt-2 w-full rounded-lg border border-pl-border bg-pl-bg px-3 py-2 outline-none focus:border-[var(--pl-accent)]"
          />
        </label>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Fields</div>
          <button
            type="button"
            onClick={addField}
            className="rounded-lg border border-pl-border px-3 py-1.5 text-xs hover:bg-pl-surface-2"
          >
            Add field
          </button>
        </div>
        {fields.map((field) => (
          <div key={field.id} className="grid gap-2 rounded-xl border border-pl-border bg-pl-bg p-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(8rem,0.7fr)_auto_minmax(0,1.6fr)_auto] lg:items-center">
            <input
              value={field.name}
              onChange={(event) => updateField(field.id, { name: event.target.value })}
              placeholder="field_name"
              className="min-w-0 rounded-lg border border-pl-border bg-pl-surface px-3 py-2 font-mono text-xs outline-none focus:border-[var(--pl-accent)]"
              required
            />
            <select
              value={field.type}
              onChange={(event) => updateField(field.id, { type: event.target.value as TemplateField["type"] })}
              className="min-w-0 rounded-lg border border-pl-border bg-pl-surface px-3 py-2 text-sm outline-none focus:border-[var(--pl-accent)]"
            >
              {TEMPLATE_FIELD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-pl-border bg-pl-surface px-3 py-2 text-sm text-pl-fg-dim lg:border-0 lg:bg-transparent lg:px-0">
              <input
                type="checkbox"
                checked={Boolean(field.required)}
                onChange={(event) => updateField(field.id, { required: event.target.checked })}
              />
              Required
            </label>
            <input
              value={field.description ?? ""}
              onChange={(event) => updateField(field.id, { description: event.target.value })}
              placeholder="What should the AI look for?"
              className="min-w-0 rounded-lg border border-pl-border bg-pl-surface px-3 py-2 text-sm outline-none focus:border-[var(--pl-accent)]"
            />
            <button
              type="button"
              onClick={() => removeField(field.id)}
              disabled={fields.length === 1}
              className="inline-flex items-center justify-center rounded-lg border border-pl-border p-2 text-pl-fg-dim hover:bg-pl-surface-2 disabled:opacity-40"
              aria-label={`Remove ${field.name}`}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </form>
  );
}
