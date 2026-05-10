"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { TemplateField, TemplateRow } from "@/lib/types";

export function CommunityTemplates({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [usingId, setUsingId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  async function addTemplate(template: TemplateRow) {
    if (usingId) return;
    setUsingId(template.id);
    try {
      const res = await fetch(`/api/community-templates/${template.id}/use`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        template?: { name: string };
        error?: string;
        detail?: string;
      };
      if (!res.ok || !body.template) {
        toast.error("Could not add template", {
          description: body.detail ?? body.error ?? "Unknown error",
        });
        return;
      }
      toast.success("Template added", {
        description: `${body.template.name} is now in your workspace.`,
      });
      router.refresh();
    } finally {
      setUsingId(null);
    }
  }

  async function vote(template: TemplateRow) {
    if (votingId) return;
    setVotingId(template.id);
    try {
      const res = await fetch(`/api/community-templates/${template.id}/vote`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        upvoted?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        toast.error("Could not update vote", {
          description: body.detail ?? body.error ?? "Unknown error",
        });
        return;
      }
      toast.success(body.upvoted ? "Upvoted" : "Vote removed");
      router.refresh();
    } finally {
      setVotingId(null);
    }
  }

  if (!templates.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-pl-border bg-pl-surface p-6 text-sm text-pl-fg-dim">
        No community templates yet. Publish a useful custom template to seed the library.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <article key={template.id} className="flex min-h-[280px] flex-col rounded-2xl border border-pl-border bg-pl-surface p-5">
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

          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            <Stat label="Fields" value={(template.schema.fields ?? []).length.toString()} />
            <Stat label="Votes" value={(template.upvotes_count ?? 0).toString()} />
            <Stat label="Uses" value={(template.uses_count ?? 0).toString()} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(template.schema.fields ?? []).slice(0, 5).map((field) => (
              <FieldChip key={field.name} field={field} />
            ))}
            {(template.schema.fields ?? []).length > 5 ? (
              <span className="rounded-full border border-pl-border px-2.5 py-1 text-xs text-pl-fg-dim">
                +{(template.schema.fields ?? []).length - 5} more
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex gap-2 pt-5">
            <button
              type="button"
              onClick={() => addTemplate(template)}
              disabled={usingId === template.id}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--pl-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              <Download className="h-4 w-4" strokeWidth={1.75} />
              {usingId === template.id ? "Adding..." : "Use"}
            </button>
            <button
              type="button"
              onClick={() => vote(template)}
              disabled={votingId === template.id}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-pl-border px-3 py-2 text-sm hover:bg-pl-surface-2 disabled:opacity-60"
            >
              <ThumbsUp className="h-4 w-4" strokeWidth={1.75} />
              {template.upvotes_count ?? 0}
            </button>
          </div>
        </article>
      ))}
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
