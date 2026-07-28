"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getOrCreateOperationToken(storageKey: string) {
  const existing = window.localStorage.getItem(storageKey);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const token = window.crypto.randomUUID();
  window.localStorage.setItem(storageKey, token);
  return token;
}

export function DeleteDocumentButton({
  documentId,
  filename,
}: {
  documentId: string;
  filename: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (isPending) return;
    const storageKey = `paperline:document-delete:${documentId}`;
    const operationToken = getOrCreateOperationToken(storageKey);
    const confirmed = window.confirm(
      `Delete “${filename}”? This permanently removes the private file, extracted text, extraction results, its chat links, and chats used only by this document. Shared chats are preserved. This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsPending(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operationToken }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.ok) {
        toast.error("Could not delete document", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }

      window.localStorage.removeItem(storageKey);
      toast.success("Document deleted");
      router.replace("/documents");
      router.refresh();
    } catch {
      toast.error("Could not delete document", {
        description: "Check your connection and try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
