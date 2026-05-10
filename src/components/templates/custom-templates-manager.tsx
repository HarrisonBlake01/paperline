"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, FileText, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CustomTemplateForm } from "@/components/templates/custom-template-form";
import { errorDescription } from "@/lib/client-errors";
import type { TemplateField, TemplateRow } from "@/lib/types";

export function CustomTemplatesManager({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  async function publishTemplate(template: TemplateRow) {
    if (publishingId) return;
    const confirmed = window.confirm(
      `Publish “${template.name}” to the community library? Other users will be able to copy and upvote it.`,
    );
    if (!confirmed) return;

    setPublishingId(template.id);
    try {
      const res = await fetch(`/api/templates/${template.id}/publish`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        template?: { name: string };
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.template) {
        toast.error("Could not publish template", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("Published to community", { description: body.template.name });
      router.refresh();
    } finally {
      setPublishingId(null);
    }
  }

  async function deleteTemplate(template: TemplateRow) {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Delete “${template.name}”? This cannot be undone. Templates with extraction history will be kept for audit safety.`,
    );
    if (!confirmed) return;

    setDeletingId(template.id);
    try {
      const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.ok) {
        toast.error("Could not delete template", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("Template deleted", { description: template.name });
      if (editingId === template.id) setEditingId(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (!templates.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-pl-border bg-pl-surface p-6 text-sm text-pl-fg-dim">
        No custom templates yet. Create one above, then open any uploaded document and run it from the Extractions panel.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {editingId ? (
        <CustomTemplateForm
          template={templates.find((template) => template.id === editingId)}
          onCancel={() => setEditingId(null)}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="flex min-h-[260px] flex-col rounded-2xl border border-pl-border bg-pl-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-[var(--pl-accent)]/12 p-2 text-[var(--pl-accent)]">
                <FileText className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <span className="rounded-full bg-pl-surface-2 px-2.5 py-1 text-[11px] uppercase tracking-wider text-pl-fg-dim">
                {template.doc_type}
              </span>
            </div>

            <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold tracking-tight">
              {template.name}
            </h3>
            <p className="mt-2 text-sm text-pl-fg-dim">
              {template.description ?? "No description provided."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <Stat label="Fields" value={(template.schema.fields ?? []).length.toString()} />
              <Stat label="Required" value={(template.schema.fields ?? []).filter((field) => field.required).length.toString()} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(template.schema.fields ?? []).slice(0, 6).map((field) => (
                <FieldChip key={field.name} field={field} />
              ))}
              {(template.schema.fields ?? []).length > 6 ? (
                <span className="rounded-full border border-pl-border px-2.5 py-1 text-xs text-pl-fg-dim">
                  +{(template.schema.fields ?? []).length - 6} more
                </span>
              ) : null}
            </div>

            <div className="mt-auto flex gap-2 pt-5">
              <button
                type="button"
                onClick={() => setEditingId(template.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-pl-border px-3 py-2 text-sm hover:bg-pl-surface-2"
              >
                <Edit3 className="h-4 w-4" strokeWidth={1.75} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteTemplate(template)}
                disabled={deletingId === template.id}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                {deletingId === template.id ? "Deleting..." : "Delete"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => publishTemplate(template)}
              disabled={Boolean(template.is_community) || publishingId === template.id}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-pl-border px-3 py-2 text-sm text-pl-fg-dim hover:bg-pl-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} />
              {template.is_community
                ? "Published to community"
                : publishingId === template.id
                  ? "Publishing..."
                  : "Publish to community"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-pl-border bg-pl-bg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-pl-fg-dim">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}

function FieldChip({ field }: { field: TemplateField }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs ${
        field.required
          ? "border-[var(--pl-accent)]/35 bg-[var(--pl-accent)]/10 text-[var(--pl-accent)]"
          : "border-pl-border text-pl-fg-dim"
      }`}
      title={`${field.name} · ${field.type}${field.required ? " · required" : ""}`}
    >
      {field.name}
    </span>
  );
}
