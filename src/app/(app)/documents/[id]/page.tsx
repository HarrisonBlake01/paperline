import { notFound } from "next/navigation";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { explainDocumentFailure } from "@/lib/documents/failure";
import { ReprocessButton } from "@/components/reprocess-button";
import { ChatWithDocButton } from "@/components/chat-with-doc-button";
import { RunExtractionForm } from "@/components/run-extraction-form";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import type { TemplateRow } from "@/lib/types";

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
  const [{ data: doc }, { data: extractions }, { data: templates }] = await Promise.all([
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
    sb
      .from("templates")
      .select("*")
      .or(`workspace_id.is.null,workspace_id.eq.${ctx.workspace.id}`)
      .order("is_builtin", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  if (!doc) notFound();

  const failure = explainDocumentFailure(doc.error_message, doc.mime_type);
  const ocrMeta = (doc.metadata && typeof doc.metadata === "object"
    ? (doc.metadata as Record<string, unknown>).ocr
    : null) as { truncated?: boolean; totalPages?: number } | null;
  const templateRows = (templates ?? []) as TemplateRow[];
  const templateNames = new Map(templateRows.map((template) => [template.id, template.name]));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="break-words font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
            {doc.filename}
          </h1>
          <p className="mt-2 text-sm text-pl-fg-dim">
            {doc.doc_type ?? "unclassified"} · {doc.status}
            {doc.page_count ? ` · ${doc.page_count} pages` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChatWithDocButton
            documentId={doc.id}
            disabled={doc.status !== "ready"}
          />
          <ReprocessButton documentId={doc.id} />
          <DeleteDocumentButton documentId={doc.id} filename={doc.filename} />
        </div>
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
                <div className="mt-4 rounded-lg border border-red-400/20 bg-red-950/20 p-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-red-200/80">
                    What to try next
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-red-100/85">
                    {failure.nextSteps.map((step) => (
                      <li key={step}>• {step}</li>
                    ))}
                  </ul>
                </div>

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
            <p className="mt-2 text-sm text-pl-fg-dim">
              Pick a template to turn this document into structured fields.
              Paperline suggests a template from the detected type, or AI can create a reusable custom template from this document.
            </p>
            <div className="mt-4">
              <RunExtractionForm
                documentId={doc.id}
                disabled={doc.status !== "ready"}
                suggestedDocType={doc.doc_type}
                templates={templateRows.map((template) => ({
                  id: template.id,
                  name: template.name,
                  docType: template.doc_type,
                  fieldCount: template.schema.fields?.length ?? 0,
                  isBuiltin: template.is_builtin,
                }))}
              />
            </div>
            <div className="mt-4 space-y-3">
              {extractions?.length ? (
                extractions.map((ex) => (
                  <div key={ex.id} className="rounded-xl border border-pl-border p-3 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="min-w-0 truncate">{templateNames.get(ex.template_id) ?? "Template"} · {ex.status}</span>
                      <span className="max-w-full truncate font-mono text-xs text-pl-fg-dim sm:max-w-40">{ex.model ?? "—"}</span>
                    </div>
                    {ex.result ? (
                      <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-pl-fg-dim">{JSON.stringify(ex.result, null, 2)}</pre>
                    ) : ex.error_message ? (
                      <p className="mt-3 text-xs text-red-400">
                        Extraction failed. Retry the extraction or contact the Paperline owner if it continues.
                      </p>
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
