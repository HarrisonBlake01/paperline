import { notFound } from "next/navigation";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { explainDocumentFailure } from "@/lib/documents/failure";
import { ReprocessButton } from "@/components/reprocess-button";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getActiveWorkspace();
  if (!ctx) notFound();
  const { id } = await params;

  const sb = createServiceClient();
  const [{ data: doc }, { data: extractions }] = await Promise.all([
    sb
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", ctx.workspace.id)
      .single(),
    sb
      .from("extractions")
      .select("*")
      .eq("document_id", id)
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!doc) notFound();

  const failure = explainDocumentFailure(doc.error_message, doc.mime_type);
  const ocrMeta = (doc.metadata && typeof doc.metadata === "object"
    ? (doc.metadata as Record<string, unknown>).ocr
    : null) as { truncated?: boolean; totalPages?: number } | null;

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            {doc.filename}
          </h1>
          <p className="mt-2 text-sm text-pl-fg-dim">
            {doc.doc_type ?? "unclassified"} · {doc.status}
            {doc.page_count ? ` · ${doc.page_count} pages` : ""}
          </p>
        </div>
        <ReprocessButton documentId={doc.id} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-pl-border bg-pl-surface p-5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Extracted text preview</div>
            {ocrMeta?.truncated && ocrMeta.totalPages ? (
              <div className="text-[11px] text-amber-300">
                OCR limited to first {doc.page_count} of {ocrMeta.totalPages} pages
              </div>
            ) : null}
          </div>
          <pre className="mt-4 max-h-[70vh] overflow-auto whitespace-pre-wrap font-sans text-sm leading-6 text-pl-fg/90">
            {doc.text_content?.slice(0, 15000) || "No extracted text yet."}
          </pre>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-pl-border bg-pl-surface p-5">
            <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Details</div>
            {failure ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
                <div className="font-medium text-red-300">{failure.title}</div>
                <p className="mt-1 text-red-200/90">{failure.guidance}</p>
                {doc.error_message ? (
                  <p className="mt-3 font-mono text-xs text-red-200/80">Raw error: {doc.error_message}</p>
                ) : null}
              </div>
            ) : null}
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-pl-fg-dim">Status</dt><dd>{doc.status}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-pl-fg-dim">Type</dt><dd>{doc.doc_type ?? "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-pl-fg-dim">Pages</dt><dd>{doc.page_count ?? "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-pl-fg-dim">Uploaded</dt><dd>{new Date(doc.created_at).toLocaleString()}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-pl-border bg-pl-surface p-5">
            <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Extractions</div>
            <div className="mt-4 space-y-3">
              {extractions?.length ? (
                extractions.map((ex) => (
                  <div key={ex.id} className="rounded-xl border border-pl-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span>{ex.status}</span>
                      <span className="font-mono text-xs text-pl-fg-dim">{ex.model ?? "—"}</span>
                    </div>
                    {ex.result ? (
                      <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-pl-fg-dim">{JSON.stringify(ex.result, null, 2)}</pre>
                    ) : ex.error_message ? (
                      <p className="mt-3 text-xs text-red-400">{ex.error_message}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-pl-fg-dim">No extractions yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
