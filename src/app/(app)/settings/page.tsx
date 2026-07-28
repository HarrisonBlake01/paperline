import Link from "next/link";
import {
  Activity,
  CreditCard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getActiveWorkspace, isAdmin } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import { DeleteWorkspacePanel } from "@/components/settings/delete-workspace-panel";

export const dynamic = "force-dynamic";

interface MemberRow {
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface AuditRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  created_at: string;
}

export default async function SettingsPage() {
  const ctx = await getActiveWorkspace();
  if (!ctx) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <p className="text-pl-fg-dim">No workspace yet. Sign in to continue.</p>
      </main>
    );
  }

  const canViewAdminData = isAdmin(ctx.role);
  const sb = createServiceClient();
  const [{ data: membersData }, { data: auditData }] = canViewAdminData
    ? await Promise.all([
        sb
          .from("workspace_members")
          .select("user_id,role,joined_at")
          .eq("workspace_id", ctx.workspace.id)
          .order("joined_at", { ascending: true }),
        sb
          .from("audit_logs")
          .select("id,actor_user_id,action,target_type,created_at")
          .eq("workspace_id", ctx.workspace.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ])
    : [{ data: [] }, { data: [] }];

  const members = (membersData ?? []) as MemberRow[];
  const auditRows = (auditData ?? []) as AuditRow[];
  const plan = PLANS[ctx.workspace.plan];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
          <Settings className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.75} />
          Workspace controls
        </p>
        <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-pl-fg-dim">
          Manage workspace identity, billing, access, and operational activity.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-pl-border bg-pl-surface p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">
                Workspace
              </div>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight">
                {ctx.workspace.name}
              </h2>
              <p className="mt-1 font-mono text-xs text-pl-fg-dim">
                {ctx.workspace.slug}
              </p>
            </div>
            <span className="rounded-full bg-[var(--pl-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--pl-accent)]">
              {ctx.role}
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info label="Plan" value={plan.name} />
            <Info
              label="Pages"
              value={`${ctx.workspace.pages_used_this_period} / ${formatLimit(ctx.workspace.pages_limit)}`}
            />
            <Info
              label="Members"
              value={canViewAdminData ? members.length.toString() : "Restricted"}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-pl-border bg-pl-surface p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pl-accent)]/12 text-[var(--pl-accent)]">
            <CreditCard className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h2 className="mt-4 font-[var(--font-display)] text-xl font-semibold tracking-tight">
            Billing
          </h2>
          <p className="mt-2 text-sm text-pl-fg-dim">
            Review plan limits, upgrade, or open the Stripe customer portal.
          </p>
          <Link
            href="/settings/billing"
            className="mt-5 inline-flex rounded-lg border border-pl-border px-3 py-2 text-sm hover:bg-pl-surface-2"
          >
            Manage billing
          </Link>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-pl-border bg-pl-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-pl-fg-dim" strokeWidth={1.6} />
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              Members
            </h2>
          </div>
          {!canViewAdminData ? (
            <p className="rounded-xl border border-dashed border-pl-border bg-pl-bg p-5 text-sm text-pl-fg-dim">
              Member identities are available only to workspace owners and admins.
            </p>
          ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="rounded-xl border border-pl-border bg-pl-bg px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-xs">
                    {member.user_id}
                  </span>
                  <span className="rounded-full bg-pl-surface-2 px-2.5 py-1 text-[11px] uppercase tracking-wider text-pl-fg-dim">
                    {member.role}
                  </span>
                </div>
                <div className="mt-1 text-xs text-pl-fg-dim">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        <section className="rounded-2xl border border-pl-border bg-pl-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-pl-fg-dim" strokeWidth={1.6} />
            <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
              Recent activity
            </h2>
          </div>
          {!canViewAdminData ? (
            <div className="rounded-xl border border-dashed border-pl-border bg-pl-bg p-6 text-sm text-pl-fg-dim">
              Audit activity is available only to workspace owners and admins.
            </div>
          ) : !auditRows.length ? (
            <div className="rounded-xl border border-dashed border-pl-border bg-pl-bg p-6 text-sm text-pl-fg-dim">
              Activity will appear here as documents, templates, and billing
              events move through the workspace.
            </div>
          ) : (
            <div className="space-y-3">
              {auditRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-start gap-3 rounded-xl border border-pl-border bg-pl-bg px-4 py-3"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pl-accent-2)]" strokeWidth={1.6} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{row.action}</div>
                    <div className="mt-1 truncate text-xs text-pl-fg-dim">
                      {row.target_type ?? "workspace"} · {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {ctx.role === "owner" ? (
        <DeleteWorkspacePanel
          workspaceId={ctx.workspace.id}
          workspaceName={ctx.workspace.name}
          memberCount={members.length}
          hasActiveSubscription={Boolean(ctx.workspace.stripe_subscription_id)}
        />
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pl-border bg-pl-bg p-4">
      <div className="text-[10px] uppercase tracking-wider text-pl-fg-dim">
        {label}
      </div>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}

function formatLimit(value: number) {
  return value === -1 ? "Unlimited" : value.toLocaleString("en-US");
}
