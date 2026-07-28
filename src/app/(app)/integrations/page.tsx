import Link from "next/link";
import {
  CheckCircle2,
  Cloud,
  Code2,
  Inbox,
  Mail,
  Plug,
  Webhook,
} from "lucide-react";
import { getActiveWorkspace, isAdmin } from "@/lib/auth/workspace";
import { PLANS } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/server";
import { ApiKeysPanel } from "@/components/integrations/api-keys-panel";

const integrations = [
  {
    name: "MCP / API",
    description:
      "Connect Paperline document tools to your preferred AI model, agent harness, or MCP-compatible client.",
    icon: Code2,
    state: "Available",
    available: true,
  },
  {
    name: "Email inbox",
    description: "Forward attachments to a workspace address and process them automatically.",
    icon: Mail,
    state: "Planned",
    available: false,
  },
  {
    name: "Google Drive",
    description: "Watch folders for new PDFs, DOCX files, scans, and reports.",
    icon: Cloud,
    state: "Planned",
    available: false,
  },
  {
    name: "Dropbox",
    description: "Import signed contracts, vendor bills, and exported packets.",
    icon: Inbox,
    state: "Planned",
    available: false,
  },
  {
    name: "Webhooks",
    description: "Planned outbound notifications for completed extractions.",
    icon: Webhook,
    state: "Planned",
    available: false,
  },
] as const;

export default async function IntegrationsPage() {
  const ctx = await getActiveWorkspace();
  const plan = PLANS[ctx?.workspace.plan ?? "free"];
  const appUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://paperline-xi.vercel.app";
  const canManage = Boolean(ctx && isAdmin(ctx.role));
  const apiKeys = ctx && canManage
    ? (await createServiceClient()
        .from("api_keys")
        .select("id,name,prefix,scopes,expires_at,last_used_at,created_at,revoked_at")
        .eq("workspace_id", ctx.workspace.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })).data ?? []
    : [];


  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
            <Plug className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.75} />
            Sources, agents, and automation
          </p>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
            Integrations
          </h1>
          <p className="mt-2 max-w-2xl text-pl-fg-dim">
            Connect document sources or give your preferred AI harness secure,
            read-only access to Paperline workspace tools.
          </p>
        </div>
        <Link
          href="/settings/billing"
          className="inline-flex items-center justify-center rounded-xl border border-pl-border px-4 py-2 text-sm hover:bg-pl-surface"
        >
          Current plan: {plan.name}
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-pl-border bg-pl-surface p-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              Upload documents, then use them from the tools you already trust.
            </h2>
            <p className="mt-2 text-sm text-pl-fg-dim">
              MCP/API access uses the same citations, templates, and workspace
              boundaries as the Paperline app. Your agent supplies its own LLM;
              Paperline supplies authenticated document context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Available now" value="Uploads + MCP/API" />
            <MiniStat label="AI choice" value="Bring your own LLM" />
            <MiniStat label="Initial access" value="4 read-only tools" />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const available = integration.available;
          const Icon = integration.icon;
          return (
            <article
              key={integration.name}
              id={available ? "mcp-api-card" : undefined}
              className="flex min-h-[240px] flex-col rounded-2xl border border-pl-border bg-pl-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-[var(--pl-accent)]/12 p-2 text-[var(--pl-accent)]">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider ${
                    available
                      ? "bg-[var(--pl-accent)]/15 text-[var(--pl-accent)]"
                      : "bg-pl-surface-2 text-pl-fg-dim"
                  }`}
                >
                  {available ? "Included" : integration.state}
                </span>
              </div>
              <h2 className="mt-4 font-[var(--font-display)] text-lg font-semibold tracking-tight">
                {integration.name}
              </h2>
              <p className="mt-2 flex-1 text-sm text-pl-fg-dim">
                {integration.description}
              </p>
              {available ? (
                <Link
                  href="#mcp-api"
                  className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[var(--pl-accent)] hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Configure MCP/API below
                </Link>
              ) : (
                <div className="mt-5 flex items-center gap-2 text-xs text-pl-fg-dim">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" />
                  Uses existing document pipeline
                </div>
              )}
            </article>
          );
        })}
      </section>

      <ApiKeysPanel
        apiKeys={apiKeys}
        enabled={plan.apiAccess}
        canManage={canManage}
        endpoint={`${appUrl}/api/mcp`}
      />
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pl-border bg-pl-bg p-4">
      <div className="text-[10px] uppercase tracking-wider text-pl-fg-dim">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
