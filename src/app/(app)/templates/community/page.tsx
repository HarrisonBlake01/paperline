import Link from "next/link";
import { ArrowLeft, Globe2, Sparkles } from "lucide-react";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { CommunityTemplates } from "@/components/templates/community-templates";
import type { TemplateRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CommunityTemplatesPage() {
  const ctx = await getActiveWorkspace();
  if (!ctx) {
    return (
      <main className="mx-auto w-full max-w-6xl px-8 py-10">
        <p className="text-pl-fg-dim">No workspace yet. Sign in to continue.</p>
      </main>
    );
  }

  const { data } = await createServiceClient()
    .from("templates")
    .select("*")
    .eq("is_community", true)
    .order("upvotes_count", { ascending: false })
    .order("uses_count", { ascending: false })
    .order("created_at", { ascending: false });

  const templates = (data ?? []) as TemplateRow[];

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <Link
        href="/templates"
        className="inline-flex items-center gap-2 text-sm text-pl-fg-dim hover:text-pl-fg"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to templates
      </Link>

      <div className="mt-6 rounded-3xl border border-pl-border bg-pl-surface p-7 md:p-8">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
          <Globe2 className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.75} />
          Community library
        </p>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
              Find a template that matches your document.
            </h1>
            <p className="mt-3 max-w-2xl text-pl-fg-dim">
              Browse schemas shared by other Paperline users. Filter by document type,
              field type, popularity, or search for the exact fields you need.
            </p>
          </div>
          <div className="rounded-2xl border border-pl-border bg-pl-bg p-4 text-sm text-pl-fg-dim">
            <div className="flex items-center gap-2 font-medium text-pl-fg">
              <Sparkles className="h-4 w-4 text-[var(--pl-accent)]" strokeWidth={1.75} />
              {templates.length} templates
            </div>
            <p className="mt-1 max-w-52">
              Copy one into your workspace, then customize it for your workflow.
            </p>
          </div>
        </div>
      </div>

      <CommunityTemplates templates={templates} showFilters />
    </main>
  );
}
