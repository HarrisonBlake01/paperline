"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

export function ReprocessButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/process`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        toast.error("Re-process failed", {
          description: errorDescription(body.error),
        });
        return;
      }
      toast.success("Re-processed");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-pl-border px-3 py-2 text-sm hover:bg-pl-surface disabled:opacity-60"
    >
      {isPending ? "Re-processing..." : "Re-process"}
    </button>
  );
}
