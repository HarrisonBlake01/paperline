"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export function ApiKeysPanel({
  apiKeys,
  enabled,
  canManage,
}: {
  apiKeys: ApiKeyRow[];
  enabled: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !enabled || !canManage) return;
    setBusy(true);
    setNewKey(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "API key" }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        api_key?: string;
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.api_key) {
        toast.error("Could not create API key", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      setNewKey(body.api_key);
      setName("");
      toast.success("API key created", {
        description: "Copy it now. Paperline will not show it again.",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey(id: string) {
    if (busy || !canManage) return;
    setBusy(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detail?: unknown;
      };
      if (!res.ok || !body.ok) {
        toast.error("Could not revoke API key", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("API key revoked");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-pl-border bg-pl-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--pl-accent)]" strokeWidth={1.7} />
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              API keys
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-pl-fg-dim">
            Create scoped credentials for future upload, extraction, and webhook
            automation. Keys are shown once.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider ${
            enabled
              ? "bg-[var(--pl-accent)]/15 text-[var(--pl-accent)]"
              : "bg-pl-surface-2 text-pl-fg-dim"
          }`}
        >
          {enabled ? "Team enabled" : "Team plan"}
        </span>
      </div>

      {newKey ? (
        <div className="mt-5 rounded-xl border border-[var(--pl-accent)]/35 bg-[var(--pl-accent)]/10 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--pl-accent)]">
            Copy this key now
          </div>
          <code className="mt-2 block overflow-x-auto rounded-lg bg-pl-bg px-3 py-2 text-xs text-pl-fg">
            {newKey}
          </code>
        </div>
      ) : null}

      <form onSubmit={createKey} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Production sync"
          disabled={!enabled || !canManage || busy}
          className="min-w-0 flex-1 rounded-xl border border-pl-border bg-pl-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pl-accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!enabled || !canManage || busy}
          className="rounded-xl bg-[var(--pl-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create key
        </button>
      </form>

      {!canManage ? (
        <p className="mt-3 text-xs text-pl-fg-dim">
          Only workspace owners and admins can manage API keys.
        </p>
      ) : !enabled ? (
        <p className="mt-3 text-xs text-pl-fg-dim">
          API keys unlock on Team and Enterprise plans.
        </p>
      ) : null}

      <div className="mt-5 divide-y divide-pl-border overflow-hidden rounded-xl border border-pl-border">
        {apiKeys.length ? (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex flex-col gap-3 bg-pl-bg px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{key.name}</div>
                <div className="mt-1 font-mono text-xs text-pl-fg-dim">
                  {key.prefix}... · created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at
                    ? ` · used ${new Date(key.last_used_at).toLocaleDateString()}`
                    : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => revokeKey(key.id)}
                disabled={busy || !canManage}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-pl-border px-3 py-1.5 text-xs text-pl-fg-dim hover:bg-pl-surface hover:text-pl-fg disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                Revoke
              </button>
            </div>
          ))
        ) : (
          <div className="bg-pl-bg px-4 py-6 text-sm text-pl-fg-dim">
            No active API keys yet.
          </div>
        )}
      </div>
    </section>
  );
}
