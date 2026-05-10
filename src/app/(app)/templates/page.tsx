import Link from "next/link";
import { FileText, Layers } from "lucide-react";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { CustomTemplateForm } from "@/components/templates/custom-template-form";
import { CustomTemplatesManager } from "@/components/templates/custom-templates-manager";
import { CommunityTemplates } from "@/components/templates/community-templates";
import type { TemplateField, TemplateRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const ctx = await getActiveWorkspace();
  if (!ctx) {
    return (
      <main className="mx-auto w-full max-w-6xl px-8 py-10">
        <p className="text-pl-fg-dim">No workspace yet. Sign in to continue.</p>
      </main>
    );
  }

  const sb = createServiceClient();
  const [{ data }, { data: communityData }] = await Promise.all([
    sb
      .from("templates")
      .select("*")
      .or(`workspace_id.is.null,workspace_id.eq.${ctx.workspace.id}`)
      .order("is_builtin", { ascending: false })
      .order("name", { ascending: true }),
    sb
      .from("templates")
      .select("*")
      .eq("is_community", true)
      .order("upvotes_count", { ascending: false })
      .order("uses_count", { ascending: false })
      .limit(12),
  ]);

  const templates = (data ?? []) as TemplateRow[];
  const builtIns = templates.filter((template) => template.is_builtin);
  const custom = templates.filter((template) => !template.is_builtin);
  const community = (communityData ?? []) as TemplateRow[];

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
            <Layers className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.75} />
            Extraction templates
          </p>
          <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Templates
          </h1>
          <p className="mt-2 max-w-2xl text-pl-fg-dim">
            Choose the fields Paperline should extract from each document type.
            For most users, the easiest path is opening an uploaded document and letting AI create the template automatically.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-pl-border px-4 py-2 text-sm hover:bg-pl-surface"
        >
          Upload a document
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
            Built-in templates
          </h2>
          <span className="text-sm text-pl-fg-dim">{builtIns.length} included</span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {builtIns.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              Community templates
            </h2>
            <p className="mt-1 text-sm text-pl-fg-dim">
              Reuse popular schemas from other users instead of spending AI credits generating from scratch.
            </p>
          </div>
          <span className="text-sm text-pl-fg-dim">{community.length} shown</span>
        </div>
        <CommunityTemplates templates={community} />
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
            Custom templates / advanced editor
          </h2>
          <span className="text-sm text-pl-fg-dim">{custom.length} created</span>
        </div>
        <div className="mt-4">
          <CustomTemplateForm />
        </div>
        <CustomTemplatesManager templates={custom} />
      </section>
    </main>
  );
}

function TemplateCard({ template }: { template: TemplateRow }) {
  const fields = template.schema.fields ?? [];
  const requiredFields = fields.filter((field) => field.required);

  return (
    <article className="flex min-h-[260px] flex-col rounded-2xl border border-pl-border bg-pl-surface p-5">
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
        <Stat label="Fields" value={fields.length.toString()} />
        <Stat label="Required" value={requiredFields.length.toString()} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {fields.slice(0, 6).map((field) => (
          <FieldChip key={field.name} field={field} />
        ))}
        {fields.length > 6 ? (
          <span className="rounded-full border border-pl-border px-2.5 py-1 text-xs text-pl-fg-dim">
            +{fields.length - 6} more
          </span>
        ) : null}
      </div>
    </article>
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
