"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Search, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";
import type { TemplateField, TemplateRow } from "@/lib/types";

type CommunityTemplatesProps = {
  templates: TemplateRow[];
  showFilters?: boolean;
};

type SortKey = "popular" | "most-used" | "newest" | "name";

export function CommunityTemplates({ templates, showFilters = false }: CommunityTemplatesProps) {
  const router = useRouter();
  const [usingId, setUsingId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [docType, setDocType] = useState("all");
  const [fieldType, setFieldType] = useState("all");
  const [sort, setSort] = useState<SortKey>("popular");

  const docTypes = useMemo(
    () => Array.from(new Set(templates.map((template) => template.doc_type))).sort(),
    [templates],
  );
  const fieldTypes = useMemo(
    () =>
      Array.from(
        new Set(
          templates.flatMap((template) =>
            (template.schema.fields ?? []).map((field) => field.type),
          ),
        ),
      ).sort(),
    [templates],
  );
  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates
      .filter((template) => {
        const fields = template.schema.fields ?? [];
        const searchable = [
          template.name,
          template.description ?? "",
          template.doc_type,
          ...fields.flatMap((field) => [field.name, field.description ?? "", field.type]),
        ]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesDocType = docType === "all" || template.doc_type === docType;
        const matchesFieldType = fieldType === "all" || fields.some((field) => field.type === fieldType);
        return matchesQuery && matchesDocType && matchesFieldType;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sort === "most-used") return (b.uses_count ?? 0) - (a.uses_count ?? 0);
        return (b.upvotes_count ?? 0) - (a.upvotes_count ?? 0) || (b.uses_count ?? 0) - (a.uses_count ?? 0);
      });
  }, [docType, fieldType, query, sort, templates]);

  async function addTemplate(template: TemplateRow) {
    if (usingId) return;
    setUsingId(template.id);
    try {
      const res = await fetch(`/api/community-templates/${template.id}/use`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        template?: { name: string };
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.template) {
        toast.error("Could not add template", {
          description: errorDescription(body.detail ?? body.error),
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
        detail?: unknown;
      };
      if (!res.ok) {
        toast.error("Could not update vote", {
          description: errorDescription(body.detail ?? body.error),
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
    <div className="mt-4 space-y-4">
      {showFilters ? (
        <div className="rounded-2xl border border-pl-border bg-pl-surface p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pl-fg-dim" strokeWidth={1.75} />
              <span className="sr-only">Search community templates</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by template, field, description..."
                className="w-full rounded-xl border border-pl-border bg-pl-bg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--pl-accent)]"
              />
            </label>
            <FilterSelect label="Document type" value={docType} onChange={setDocType}>
              <option value="all">All document types</option>
              {docTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Field type" value={fieldType} onChange={setFieldType}>
              <option value="all">All field types</option>
              {fieldTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Sort" value={sort} onChange={(value) => setSort(value as SortKey)}>
              <option value="popular">Most popular</option>
              <option value="most-used">Most used</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </FilterSelect>
          </div>
          <div className="mt-3 text-sm text-pl-fg-dim">
            Showing {filteredTemplates.length} of {templates.length} community templates.
          </div>
        </div>
      ) : null}

      {filteredTemplates.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
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
      ) : (
        <div className="rounded-2xl border border-dashed border-pl-border bg-pl-surface p-6 text-sm text-pl-fg-dim">
          No templates match those filters. Try a broader search or another document type.
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-pl-border bg-pl-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pl-accent)]"
      >
        {children}
      </select>
    </label>
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
