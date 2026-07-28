import { randomUUID } from "node:crypto";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { PLANS } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const ctx = await getActiveWorkspace();
  const current = ctx ? PLANS[ctx.workspace.plan] : null;
  const recruiterDemo = process.env.PAPERLINE_RECRUITER_DEMO === "true";
  const operationIds: Record<"pro" | "team", string> = {
    pro: randomUUID(),
    team: randomUUID(),
  };
  if (ctx) {
    const sb = createServiceClient();
    const { data: pendingOperations } = await sb
      .from("workspace_billing_operations")
      .select("id,requested_plan")
      .eq("workspace_id", ctx.workspace.id)
      .in("status", ["creating", "open"]);
    for (const operation of pendingOperations ?? []) {
      if (operation.requested_plan === "pro") {
        operationIds.pro = String(operation.id);
      } else if (operation.requested_plan === "team") {
        operationIds.team = String(operation.id);
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
        Billing
      </h1>
      <p className="mt-2 text-pl-fg-dim">
        Manage your Paperline plan, page allowance, and template limits.
      </p>

      {recruiterDemo ? (
        <aside
          className="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 px-5 py-4 text-amber-950"
          aria-label="Recruiter demo billing notice"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.16em]">
            Recruiter demo · Stripe test mode
          </div>
          <p className="mt-2 text-sm leading-6">
            You can preview Paperline&apos;s checkout and payment-method experience.
            No real payment method will be charged, and no live Stripe transaction is available in this environment.
          </p>
        </aside>
      ) : null}

      <div className="mt-8 rounded-2xl border border-pl-border bg-pl-surface p-6">
        <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Current plan</div>
        <div className="mt-2 font-[var(--font-display)] text-2xl font-semibold">
          {current?.name ?? "Free"}
        </div>
        {ctx ? (
          <p className="mt-2 text-sm text-pl-fg-dim">
            {ctx.workspace.pages_used_this_period} / {ctx.workspace.pages_limit} pages used this period.
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {(["free", "pro", "team"] as const).map((id) => {
          const plan = PLANS[id];
          const isCurrent = current?.id === plan.id;
          return (
            <div key={id} className="rounded-2xl border border-pl-border bg-pl-surface p-6">
              <div className="text-sm uppercase tracking-wider text-pl-fg-dim">{plan.name}</div>
              <div className="mt-2 font-[var(--font-display)] text-3xl font-semibold">
                {plan.priceMonthly === 0 ? "$0" : `$${plan.priceMonthly}`}
                <span className="ml-1 text-sm text-pl-fg-dim">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-pl-fg-dim">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="mt-5 rounded-lg border border-pl-border px-3 py-2 text-center text-sm">Current plan</div>
              ) : plan.id === "free" ? (
                <div className="mt-5 rounded-lg border border-pl-border px-3 py-2 text-center text-sm text-pl-fg-dim">Downgrade support coming soon</div>
              ) : current && current.id !== "free" ? (
                <div className="mt-5 rounded-lg border border-pl-border px-3 py-2 text-center text-sm text-pl-fg-dim">
                  Contact billing support to change an existing paid plan
                </div>
              ) : (
                <form action="/api/billing/checkout" method="post" className="mt-5">
                  <input type="hidden" name="plan" value={plan.id} />
                  <input
                    type="hidden"
                    name="operationId"
                    value={operationIds[plan.id as "pro" | "team"]}
                  />
                  <button className="w-full rounded-lg bg-[var(--pl-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                    {recruiterDemo ? `Preview ${plan.name} checkout` : `Upgrade to ${plan.name}`}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
