"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

export function ChatWithDocButton({
  documentId,
  disabled,
}: {
  documentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending || disabled) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        chat?: { id: string };
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.chat) {
        toast.error("Could not start chat", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      router.push(`/chats/${body.chat.id}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || disabled}
      className="rounded-lg border border-pl-border bg-[var(--pl-accent)]/10 px-3 py-2 text-sm hover:bg-[var(--pl-accent)]/20 disabled:opacity-60"
    >
      {isPending ? "Starting..." : "Chat"}
    </button>
  );
}
