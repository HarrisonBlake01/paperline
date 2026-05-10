import Link from "next/link";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { explainDocumentFailure } from "@/lib/documents/failure";
import { formatBytes } from "@/lib/utils";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const ctx = await getActiveWorkspace();
  if (!ctx) {
    return (
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <p className="text-pl-fg-dim">No workspace yet. Sign in to continue.</p>
      </main>
    );
  }

  const sb = createServiceClient();
  const { data: docs } = await sb
    .from("documents")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
          Documents
        </h1>
        <Link
          href="/dashboard"
          className="rounded-lg border border-pl-border px-3 py-1.5 text-sm hover:bg-pl-surface"
        >
          Upload
        </Link>
      </div>

      {!docs?.length ? (
        <div className="mt-10 rounded-2xl border border-pl-border bg-pl-surface p-10 text-center text-pl-fg-dim">
          No documents yet. Upload your first one from the dashboard.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-pl-border bg-pl-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-pl-border text-left text-[11px] uppercase tracking-wider text-pl-fg-dim">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-pl-border/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div>
                      <Link
                        href={`/documents/${d.id}`}
                        className="inline-flex items-center gap-2 hover:text-[var(--pl-accent)]"
                      >
                        <FileText className="h-4 w-4 text-pl-fg-dim" strokeWidth={1.5} />
                        {d.filename}
                      </Link>
                      {d.status === "failed" ? (
                        <p className="mt-1 text-xs text-red-300">
                          {explainDocumentFailure(d.error_message, d.mime_type)?.title ?? "Processing failed"}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-pl-fg-dim">{d.doc_type ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {d.page_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {formatBytes(d.size_bytes)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={d.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-pl-fg-dim">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
