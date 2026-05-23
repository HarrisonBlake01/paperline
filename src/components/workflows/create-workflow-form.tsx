"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

interface TemplateOption {
  id: string;
  name: string;
  docType: string;
  fieldCount: number;
}

interface DocumentOption {
  id: string;
  filename: string;
  docType: string | null;
  pageCount: number | null;
}

export function CreateWorkflowForm({
  templates,
  documents,
}: {
  templates: TemplateOption[];
  documents: DocumentOption[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);

  const selectedTemplate = templates.find((template) => template.id === templateId);
  const matchingDocs = useMemo(() => {
    if (!selectedTemplate) return documents;
    const matching = documents.filter(
      (doc) => doc.docType === selectedTemplate.docType,
    );
    return matching.length ? matching : documents;
  }, [documents, selectedTemplate]);

  function toggleDocument(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !templateId || selectedIds.length === 0) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          template_id: templateId,
          document_ids: selectedIds,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        workflow?: { name: string; succeeded_count: number; failed_count: number };
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.workflow) {
        toast.error("Workflow failed", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("Workflow complete", {
        description: `${body.workflow.succeeded_count} succeeded · ${body.workflow.failed_count} failed`,
      });
      setName("");
      setSelectedIds([]);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (!templates.length || !documents.length) {
    return (
      <div className="rounded-2xl border border-dashed border-pl-border bg-pl-surface p-6 text-sm text-pl-fg-dim">
        {templates.length
          ? "Upload and process at least one document before creating a workflow."
          : "Add an extraction template before creating a workflow."}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-pl-border bg-pl-surface p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <label className="block text-sm">
          <span className="text-pl-fg-dim">Workflow name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Invoice review run"
            className="mt-2 w-full rounded-xl border border-pl-border bg-pl-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pl-accent)]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-pl-fg-dim">Template</span>
          <select
            value={templateId}
            onChange={(event) => {
              setTemplateId(event.target.value);
              setSelectedIds([]);
            }}
            className="mt-2 w-full rounded-xl border border-pl-border bg-pl-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pl-accent)]"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} · {template.fieldCount} fields
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Ready documents</div>
            <div className="mt-1 text-xs text-pl-fg-dim">
              {selectedIds.length} selected · documents are filtered toward the selected template type
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(matchingDocs.map((doc) => doc.id))}
            className="rounded-lg border border-pl-border px-3 py-1.5 text-xs hover:bg-pl-surface-2"
          >
            Select shown
          </button>
        </div>

        <div className="mt-3 grid max-h-80 gap-2 overflow-auto pr-1">
          {matchingDocs.map((doc) => (
            <label
              key={doc.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-pl-border bg-pl-bg px-3 py-2.5 text-sm hover:bg-pl-surface-2"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(doc.id)}
                onChange={() => toggleDocument(doc.id)}
                className="h-4 w-4 accent-[var(--pl-accent)]"
              />
              <FileText className="h-4 w-4 shrink-0 text-pl-fg-dim" strokeWidth={1.6} />
              <span className="min-w-0 flex-1 truncate">{doc.filename}</span>
              <span className="shrink-0 rounded-full bg-pl-surface px-2 py-0.5 text-[11px] text-pl-fg-dim">
                {doc.docType ?? "other"}
                {doc.pageCount ? ` · ${doc.pageCount}p` : ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !templateId || selectedIds.length === 0}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--pl-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <PlayCircle className="h-4 w-4" strokeWidth={1.7} />
        {isPending ? "Running workflow..." : "Run workflow"}
      </button>
    </form>
  );
}
