import { getActiveWorkspace } from "@/lib/auth/workspace";
import { PLANS } from "@/lib/plans";

export default async function BillingPage() {
  const ctx = await getActiveWorkspace();
  const current = ctx ? PLANS[ctx.workspace.plan] : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
        Billing
      </h1>
      <p className="mt-2 text-pl-fg-dim">
        Manage your Paperline plan and usage.
      </p>

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
              ) : (
                <form action="/api/billing/checkout" method="post" className="mt-5">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button className="w-full rounded-lg bg-[var(--pl-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                    Upgrade to {plan.name}
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
