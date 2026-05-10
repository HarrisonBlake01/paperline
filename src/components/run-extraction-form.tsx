"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

interface ExtractionTemplateOption {
  id: string;
  name: string;
  docType: string;
  fieldCount: number;
  isBuiltin: boolean;
}

export function RunExtractionForm({
  documentId,
  disabled,
  templates,
  suggestedDocType,
}: {
  documentId: string;
  disabled?: boolean;
  templates: ExtractionTemplateOption[];
  suggestedDocType?: string | null;
}) {
  const router = useRouter();
  const suggestedTemplate = useMemo(() => {
    if (!suggestedDocType) return templates[0];
    return (
      templates.find((template) => template.docType === suggestedDocType) ??
      templates[0]
    );
  }, [suggestedDocType, templates]);
  const [templateId, setTemplateId] = useState(suggestedTemplate?.id ?? "");
  const [isPending, setIsPending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateTemplate() {
    if (isGenerating || disabled) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/generate-template`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        template?: { name: string };
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.template) {
        toast.error("Could not generate template", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("Template generated", {
        description: `${body.template.name} is ready to use.`,
      });
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || disabled || !templateId) return;

    const template = templates.find((item) => item.id === templateId);
    setIsPending(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        detail?: unknown;
      };
      if (!res.ok) {
        toast.error("Extraction failed", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("Extraction complete", {
        description: template ? `${template.name} fields are ready.` : undefined,
      });
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (!templates.length) {
    return (
      <div className="rounded-xl border border-pl-border bg-pl-bg p-4 text-sm text-pl-fg-dim">
        No templates are available yet.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="text-pl-fg-dim">Template</span>
        <select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          disabled={isPending || disabled}
          className="mt-2 w-full rounded-lg border border-pl-border bg-pl-bg px-3 py-2 text-sm text-pl-fg outline-none focus:border-[var(--pl-accent)] disabled:opacity-60"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} · {template.fieldCount} fields
              {template.isBuiltin ? " · built-in" : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending || isGenerating || disabled || !templateId}
        className="w-full rounded-lg bg-[var(--pl-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Extracting..." : "Run extraction"}
      </button>
      <button
        type="button"
        onClick={handleGenerateTemplate}
        disabled={isPending || isGenerating || disabled}
        className="w-full rounded-lg border border-pl-border px-3 py-2 text-sm hover:bg-pl-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Generating template..." : "AI-create template from this document"}
      </button>
      {disabled ? (
        <p className="text-xs text-pl-fg-dim">
          Extractions unlock once the document status is ready.
        </p>
      ) : null}
    </form>
  );
}
