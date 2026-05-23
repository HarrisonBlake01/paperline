import Link from "next/link";
import {
  CheckCircle2,
  Cloud,
  Code2,
  Inbox,
  KeyRound,
  Mail,
  Plug,
  Webhook,
} from "lucide-react";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { PLANS } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/server";
import { ApiKeysPanel } from "@/components/integrations/api-keys-panel";

const integrations = [
  {
    name: "Email inbox",
    description: "Forward attachments to a workspace address and process them automatically.",
    icon: Mail,
    state: "Planned",
    requiredPlan: "pro",
  },
  {
    name: "Google Drive",
    description: "Watch folders for new PDFs, DOCX files, scans, and reports.",
    icon: Cloud,
    state: "Planned",
    requiredPlan: "pro",
  },
  {
    name: "Dropbox",
    description: "Import signed contracts, vendor bills, and exported packets.",
    icon: Inbox,
    state: "Planned",
    requiredPlan: "pro",
  },
  {
    name: "REST API",
    description: "Upload files, trigger templates, and retrieve extracted fields programmatically.",
    icon: Code2,
    state: "Team",
    requiredPlan: "team",
  },
  {
    name: "Webhooks",
    description: "Send completed extraction events to your internal systems.",
    icon: Webhook,
    state: "Team",
    requiredPlan: "team",
  },
  {
    name: "API keys",
    description: "Create scoped credentials for automated document workflows.",
    icon: KeyRound,
    state: "Team",
    requiredPlan: "team",
  },
] as const;

export default async function IntegrationsPage() {
  const ctx = await getActiveWorkspace();
  const plan = PLANS[ctx?.workspace.plan ?? "free"];
  const apiKeys = ctx
    ? (await createServiceClient()
        .from("api_keys")
        .select("id,name,prefix,last_used_at,created_at,revoked_at")
        .eq("workspace_id", ctx.workspace.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })).data ?? []
    : [];
  const canManage = ctx?.role === "owner" || ctx?.role === "admin";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
            <Plug className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.75} />
            Connected document sources
          </p>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
            Integrations
          </h1>
          <p className="mt-2 max-w-2xl text-pl-fg-dim">
            Connect the places where files already arrive, then route them into
            repeatable extraction and review workflows.
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
              Start with uploads. Add sources when volume grows.
            </h2>
            <p className="mt-2 text-sm text-pl-fg-dim">
              The API, webhooks, and storage connectors are designed around the
              same pipeline used by manual uploads, so every source keeps the
              same citations, templates, and workspace boundaries.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Available now" value="Manual upload" />
            <MiniStat label="Pro sources" value="Email + drives" />
            <MiniStat label="Team automation" value="API + webhooks" />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const available = isAvailable(plan.id, integration.requiredPlan);
          const Icon = integration.icon;
          return (
            <article
              key={integration.name}
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
              <div className="mt-5 flex items-center gap-2 text-xs text-pl-fg-dim">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" />
                Uses existing document pipeline
              </div>
            </article>
          );
        })}
      </section>

      <ApiKeysPanel
        apiKeys={apiKeys}
        enabled={plan.apiAccess}
        canManage={canManage}
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

function isAvailable(currentPlan: string, requiredPlan: "pro" | "team") {
  const rank: Record<string, number> = {
    free: 0,
    pro: 1,
    team: 2,
    enterprise: 3,
  };
  return rank[currentPlan] >= rank[requiredPlan];
}
