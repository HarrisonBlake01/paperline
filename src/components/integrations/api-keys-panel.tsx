"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { errorDescription } from "@/lib/client-errors";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
  scopes: string[];
  expires_at: string | null;
}

export function ApiKeysPanel({
  apiKeys,
  enabled,
  canManage,
  endpoint,
}: {
  apiKeys: ApiKeyRow[];
  enabled: boolean;
  canManage: boolean;
  endpoint: string;
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
        toast.error("Could not create access key", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      setNewKey(body.api_key);
      setName("");
      toast.success("Access key created", {
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
        toast.error("Could not revoke access key", {
          description: errorDescription(body.detail ?? body.error),
        });
        return;
      }
      toast.success("Access key revoked");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  }

  return (
    <section id="mcp-api" className="mt-8 scroll-mt-6 rounded-2xl border border-pl-border bg-pl-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--pl-accent)]" strokeWidth={1.7} />
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              MCP / API connection
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-pl-fg-dim">
            Use Paperline as a secure document skill inside Hermes, coding agents,
            and other MCP-compatible harnesses. Your client chooses the LLM;
            Paperline returns scoped workspace data and citations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full bg-[var(--pl-accent)]/15 px-2.5 py-1 text-[11px] uppercase tracking-wider text-[var(--pl-accent)]">
            Included on Free
          </span>
          <span className="w-fit rounded-full bg-pl-surface-2 px-2.5 py-1 text-[11px] uppercase tracking-wider text-pl-fg-dim">
            Read-only tools
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-pl-border bg-pl-bg p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-[var(--pl-accent-2)]" />
            Secure connection details
          </div>
          <dl className="mt-4 space-y-3 text-xs">
            <div>
              <dt className="text-pl-fg-dim">Transport</dt>
              <dd className="mt-1 font-medium">Streamable HTTP</dd>
            </div>
            <div>
              <dt className="text-pl-fg-dim">Endpoint</dt>
              <dd className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-pl-surface px-3 py-2 text-pl-fg">
                  {endpoint}
                </code>
                <button
                  type="button"
                  onClick={() => copyText(endpoint, "Endpoint")}
                  className="rounded-lg border border-pl-border p-2 text-pl-fg-dim hover:bg-pl-surface hover:text-pl-fg"
                  aria-label="Copy MCP endpoint"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-pl-fg-dim">Authorization</dt>
              <dd className="mt-1 font-medium">Bearer access key</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-pl-border bg-pl-bg p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-[var(--pl-accent)]" />
            Bring your own LLM
          </div>
          <p className="mt-3 text-xs leading-6 text-pl-fg-dim">
            Your harness handles agent-side reasoning and model billing. Paperline
            provides authenticated document metadata, citations, and templates.
            Document OCR and extraction inside Paperline still use the provider
            configured for your Paperline deployment.
          </p>
          <ol className="mt-4 space-y-2 text-xs text-pl-fg-dim">
            <li><span className="font-medium text-pl-fg">1.</span> Create an access key below.</li>
            <li><span className="font-medium text-pl-fg">2.</span> Add the endpoint and bearer key to your MCP client.</li>
            <li><span className="font-medium text-pl-fg">3.</span> Discover the four authorized read-only tools.</li>
          </ol>
        </div>
      </div>

      <div className="mt-6 border-t border-pl-border pt-6">
        <h3 className="text-sm font-semibold">Workspace access keys</h3>
        <p className="mt-1 text-xs text-pl-fg-dim">
          Keys expire after 30 days, are shown once, and stop working when revoked
          or when their creator loses workspace access.
        </p>
      </div>

      {newKey ? (
        <div className="mt-5 rounded-xl border border-[var(--pl-accent)]/35 bg-[var(--pl-accent)]/10 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--pl-accent)]">
            Copy this key now
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-pl-bg px-3 py-2 text-xs text-pl-fg">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => copyText(newKey, "Access key")}
              className="rounded-lg border border-[var(--pl-accent)]/35 p-2 text-[var(--pl-accent)] hover:bg-pl-bg"
              aria-label="Copy new access key"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={createKey} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Access key name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Hermes document access"
          disabled={!enabled || !canManage || busy}
          className="min-w-0 flex-1 rounded-xl border border-pl-border bg-pl-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pl-accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!enabled || !canManage || busy}
          className="rounded-xl bg-[var(--pl-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create access key
        </button>
      </form>

      {!canManage ? (
        <p className="mt-3 text-xs text-pl-fg-dim">
          Only workspace owners and admins can manage access keys.
        </p>
      ) : !enabled ? (
        <p className="mt-3 text-xs text-pl-fg-dim">
          MCP/API access is unavailable for this workspace plan.
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
                  {key.expires_at
                    ? ` · expires ${new Date(key.expires_at).toLocaleDateString()}`
                    : " · inactive until rotated"}
                  {key.last_used_at
                    ? ` · used ${new Date(key.last_used_at).toLocaleDateString()}`
                    : ""}
                </div>
                <div className="mt-1 text-xs text-pl-fg-dim">
                  {key.scopes.length ? key.scopes.join(" · ") : "No active scopes"}
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
            No active access keys yet.
          </div>
        )}
      </div>
    </section>
  );
}
