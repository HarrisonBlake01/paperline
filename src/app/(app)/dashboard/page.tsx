import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { FileText } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { explainDocumentFailure } from "@/lib/documents/failure";
import { formatBytes } from "@/lib/utils";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const ctx = await getActiveWorkspace();
  const recentDocs = ctx
    ? (await createServiceClient()
        .from("documents")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .order("created_at", { ascending: false })
        .limit(5)).data
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}.
        </h1>
        <span className="font-mono text-xs text-pl-fg-dim">{userId}</span>
      </div>
      <p className="mt-2 text-pl-fg-dim">
        Drop a document below to extract structured data and chat with it.
      </p>

      <div className="mt-8">
        <UploadDropzone />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              Recent documents
            </h2>
            <p className="mt-1 text-sm text-pl-fg-dim">
              Open a document to chat with it or run an extraction template.
            </p>
          </div>
          <Link
            href="/documents"
            className="rounded-lg border border-pl-border px-3 py-1.5 text-sm hover:bg-pl-surface"
          >
            Show all
          </Link>
        </div>
        {!recentDocs?.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-pl-border bg-pl-surface p-8 text-sm text-pl-fg-dim">
            No documents yet. Upload one above and it will appear here.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-pl-border bg-pl-surface">
            {recentDocs.map((doc) => {
              const failure = explainDocumentFailure(doc.error_message, doc.mime_type);
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between gap-4 border-b border-pl-border/60 px-4 py-3 text-sm last:border-0 hover:bg-pl-surface-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-pl-fg-dim" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{doc.filename}</div>
                      <div className="mt-0.5 truncate text-xs text-pl-fg-dim">
                        {failure?.title ?? `${doc.doc_type ?? "unclassified"} · ${formatBytes(doc.size_bytes)}`}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill status={doc.status} />
                    <div className="mt-1 font-mono text-[11px] text-pl-fg-dim">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Pages this month", value: "0" },
          { label: "Documents", value: "0" },
          { label: "Tokens used", value: "0" },
          { label: "Est. cost", value: "$0.00" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-pl-border bg-pl-surface p-5"
          >
            <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">
              {s.label}
            </div>
            <div className="mt-2 font-[var(--font-display)] text-2xl font-semibold">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: "bg-pl-surface-2 text-pl-fg-dim",
    processing: "bg-[var(--pl-accent-2)]/20 text-[var(--pl-accent-2)]",
    ready: "bg-[var(--pl-accent)]/15 text-[var(--pl-accent)]",
    failed: "bg-red-500/15 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-pl-surface-2 text-pl-fg-dim"
      }`}
    >
      {status}
    </span>
  );
}
