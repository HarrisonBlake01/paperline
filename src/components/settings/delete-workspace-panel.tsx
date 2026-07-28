"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getOrCreateOperationToken(storageKey: string) {
  const existing = window.localStorage.getItem(storageKey);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const token = window.crypto.randomUUID();
  window.localStorage.setItem(storageKey, token);
  return token;
}

export function DeleteWorkspacePanel({
  workspaceId,
  workspaceName,
  memberCount,
  hasActiveSubscription,
}: {
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  hasActiveSubscription: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const matches = confirmation === workspaceName;

  async function handleDelete() {
    if (isPending || !matches || hasActiveSubscription) return;
    const storageKey = `paperline:workspace-delete:${workspaceId}`;
    const operationToken = getOrCreateOperationToken(storageKey);
    const confirmed = window.confirm(
      `Permanently delete “${workspaceName}” and its data for ${memberCount} member${memberCount === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsPending(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, confirmation, operationToken }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !body.ok) {
        const description =
          body.detail ??
          (body.error === "workspace_too_large_for_self_service_deletion"
            ? "This workspace requires owner-assisted deletion."
            : body.error === "workspace_delete_unavailable"
              ? "Deletion could not complete safely. Try again before contacting support."
              : "The workspace could not be deleted.");
        toast.error("Could not delete workspace", { description });
        return;
      }

      window.localStorage.removeItem(storageKey);
      toast.success("Workspace deleted");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.error("Could not delete workspace", {
        description: "Check your connection and try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-red-500/10 p-2 text-red-300">
          <Trash2 className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div>
          <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-red-200">
            Delete workspace
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-red-100/75">
            Permanently removes this workspace, its private files, documents,
            extracted content, chats, templates, workflows, credentials, member
            access, inactive billing customer data, and operational records. This
            cannot be undone.
          </p>
        </div>
      </div>

      {hasActiveSubscription ? (
        <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Cancel the active subscription from Billing before deleting this workspace.
        </p>
      ) : (
        <div className="mt-5 max-w-xl">
          <label htmlFor="delete-workspace-confirmation" className="text-sm text-red-100/85">
            Type <strong>{workspaceName}</strong> to confirm.
          </label>
          <input
            id="delete-workspace-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            disabled={isPending}
            className="mt-2 w-full rounded-lg border border-red-500/30 bg-pl-bg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={!matches || isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            {isPending ? "Deleting workspace..." : "Permanently delete workspace"}
          </button>
        </div>
      )}
    </section>
  );
}
