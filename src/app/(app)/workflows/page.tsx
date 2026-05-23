import Link from "next/link";
import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  PlayCircle,
  Workflow,
  XCircle,
} from "lucide-react";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { CreateWorkflowForm } from "@/components/workflows/create-workflow-form";
import type { DocumentRow, TemplateRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type WorkflowStatus = "pending" | "running" | "completed" | "failed";

interface WorkflowRow {
  id: string;
  name: string;
  template_id: string;
  status: WorkflowStatus;
  total_count: number;
  succeeded_count: number;
  failed_count: number;
  created_at: string;
  templates: {
    name: string;
    doc_type: string;
  } | null;
}

const statusMeta: Record<
  WorkflowStatus,
  { icon: typeof Clock3; label: string; className: string }
> = {
  pending: {
    icon: Clock3,
    label: "Pending",
    className: "bg-pl-surface-2 text-pl-fg-dim",
  },
  running: {
    icon: PlayCircle,
    label: "Running",
    className: "bg-[var(--pl-accent-2)]/20 text-[var(--pl-accent-2)]",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "bg-[var(--pl-accent)]/15 text-[var(--pl-accent)]",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "bg-red-500/15 text-red-400",
  },
};

export default async function WorkflowsPage() {
  const ctx = await getActiveWorkspace();
  if (!ctx) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <p className="text-pl-fg-dim">No workspace yet. Sign in to continue.</p>
      </main>
    );
  }

  const sb = createServiceClient();
  const [{ data }, { data: templatesData }, { data: docsData }] =
    await Promise.all([
      sb
        .from("workflows")
        .select("id,name,template_id,status,total_count,succeeded_count,failed_count,created_at,templates(name,doc_type)")
        .eq("workspace_id", ctx.workspace.id)
        .order("created_at", { ascending: false })
        .limit(50),
      sb
        .from("templates")
        .select("*")
        .or(`workspace_id.is.null,workspace_id.eq.${ctx.workspace.id}`)
        .order("is_builtin", { ascending: false })
        .order("name", { ascending: true }),
      sb
        .from("documents")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const workflows = (data ?? []) as unknown as WorkflowRow[];
  const templates = (templatesData ?? []) as TemplateRow[];
  const documents = (docsData ?? []) as DocumentRow[];
  const running = workflows.filter((workflow) => workflow.status === "running").length;
  const completed = workflows.filter((workflow) => workflow.status === "completed").length;
  const failedItems = workflows.reduce(
    (sum, workflow) => sum + workflow.failed_count,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
            <Workflow className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.75} />
            Repeatable document workflows
          </p>
          <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Workflows
          </h1>
          <p className="mt-2 max-w-2xl text-pl-fg-dim">
            Choose ready documents, select the information you want saved, and
            turn the process into a repeatable workflow.
          </p>
        </div>
        <Link
          href="/documents"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-pl-border px-4 py-2 text-sm hover:bg-pl-surface"
        >
          <FileText className="h-4 w-4" strokeWidth={1.6} />
          Choose documents
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Active runs" value={running.toString()} />
        <Metric label="Completed runs" value={completed.toString()} />
        <Metric label="Failed items" value={failedItems.toString()} />
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
            Create workflow
          </h2>
          <p className="mt-1 text-sm text-pl-fg-dim">
            Select ready documents and save important details with the same workflow.
          </p>
        </div>
        <CreateWorkflowForm
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
            docType: template.doc_type,
            fieldCount: template.schema.fields?.length ?? 0,
          }))}
          documents={documents.map((doc) => ({
            id: doc.id,
            filename: doc.filename,
            docType: doc.doc_type,
            pageCount: doc.page_count,
          }))}
        />
      </section>

      {!workflows.length ? (
        <section className="mt-8 rounded-2xl border border-dashed border-pl-border bg-pl-surface p-10">
          <div className="flex max-w-2xl gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pl-accent)]/12 text-[var(--pl-accent)]">
              <CircleDashed className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
                No workflows yet
              </h2>
              <p className="mt-2 text-sm text-pl-fg-dim">
                Upload a few documents, pick an extraction template, and
                Paperline will save the same details from each file.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-[var(--pl-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Upload documents
                </Link>
                <Link
                  href="/templates"
                  className="rounded-lg border border-pl-border px-3 py-2 text-sm hover:bg-pl-surface-2"
                >
                  Review templates
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8 overflow-x-auto rounded-2xl border border-pl-border bg-pl-surface">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="border-b border-pl-border text-left text-[11px] uppercase tracking-wider text-pl-fg-dim">
              <tr>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr
                  key={workflow.id}
                  className="border-b border-pl-border/60 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{workflow.name}</td>
                  <td className="px-4 py-3 text-pl-fg-dim">
                    {workflow.templates?.name ?? "Deleted template"}
                    <span className="ml-2 rounded-full bg-pl-surface-2 px-2 py-0.5 text-[11px]">
                      {workflow.templates?.doc_type ?? "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Progress workflow={workflow} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={workflow.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-pl-fg-dim">
                    {new Date(workflow.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pl-border bg-pl-surface p-5">
      <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">
        {label}
      </div>
      <div className="mt-2 font-[var(--font-display)] text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}

function Progress({ workflow }: { workflow: WorkflowRow }) {
  const finished = workflow.succeeded_count + workflow.failed_count;
  const total = Math.max(workflow.total_count, 0);
  const percentage = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <div className="min-w-[180px]">
      <div className="flex items-center justify-between gap-3 font-mono text-xs">
        <span>
          {finished}/{total}
        </span>
        <span className="text-pl-fg-dim">{percentage}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-pl-surface-2">
        <div
          className="h-full rounded-full bg-[var(--pl-accent)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: WorkflowStatus }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
      {meta.label}
    </span>
  );
}
