import Link from "next/link";
import { ArrowRight, FileText, Layers, MessageSquare, Sparkles, Users, Zap } from "lucide-react";
import { PLANS } from "@/lib/plans";

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-pl-border/70 backdrop-blur supports-[backdrop-filter]:bg-pl-bg/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-[var(--font-display)] text-lg font-semibold tracking-tight">
            <span className="inline-block h-5 w-5 rounded-sm border border-pl-fg/80" aria-hidden />
            paperline
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-pl-fg-dim md:flex">
            <Link href="#features" className="hover:text-pl-fg">Product</Link>
            <Link href="#templates" className="hover:text-pl-fg">Templates</Link>
            <Link href="#pricing" className="hover:text-pl-fg">Pricing</Link>
            <Link href="/docs" className="hover:text-pl-fg">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-pl-fg-dim hover:text-pl-fg">Sign in</Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--pl-accent)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
            <Sparkles className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" strokeWidth={1.75} />
            A ShadowProductions product
          </p>
          <h1 className="font-[var(--font-display)] text-5xl font-semibold tracking-[-0.02em] leading-[1.05] md:text-6xl">
            Turn documents into answers.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pl-fg-dim">
            Paperline reads your PDFs, contracts, invoices, and reports — and gives you
            structured data, summaries, and citations you can trust.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--pl-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border border-pl-border px-4 py-2.5 text-sm hover:bg-pl-surface"
            >
              Try the live demo
            </Link>
          </div>
          <p className="mt-3 text-xs text-pl-fg-dim">No credit card required.</p>
        </div>

        {/* Hero product mock */}
        <div className="mt-16 rounded-2xl border border-pl-border bg-pl-surface p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="grid grid-cols-1 gap-2 rounded-xl bg-pl-bg p-2 md:grid-cols-[1.4fr_1fr]">
            <div className="flex h-72 items-center justify-center rounded-lg border border-pl-border bg-[var(--pl-surface-2)] text-xs text-pl-fg-dim">
              [ MSA_Acme_Corp_v2.pdf · page 12 of 45 ]
            </div>
            <div className="rounded-lg border border-pl-border bg-pl-surface p-4">
              <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Extract · Contract</div>
              <div className="mt-3 space-y-3 text-sm">
                <Field label="Parties" value="Acme Corp · Globex LLC" confidence={97} />
                <Field label="Effective date" value="Jan 14, 2026" confidence={94} />
                <Field label="Initial term" value="12 months, auto-renew" confidence={88} />
                <Field label="Governing law" value="State of Delaware" confidence={92} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
          Everything you need to ship document workflows.
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-pl-border bg-pl-border md:grid-cols-3">
          <Feature icon={<FileText className="h-5 w-5" strokeWidth={1.5} />} title="Upload anything" body="PDFs, DOCX, scans, invoices. We handle parsing and OCR." />
          <Feature icon={<Layers className="h-5 w-5" strokeWidth={1.5} />} title="Extract structured data" body="Built-in templates for invoices, contracts, resumes, and reports." />
          <Feature icon={<MessageSquare className="h-5 w-5" strokeWidth={1.5} />} title="Chat with citations" body="Every answer cites the exact page and passage." />
          <Feature icon={<Zap className="h-5 w-5" strokeWidth={1.5} />} title="Custom templates" body="Define your own fields and run them across batches of docs." />
          <Feature icon={<Users className="h-5 w-5" strokeWidth={1.5} />} title="Team workspaces" body="Roles, audit logs, and shared folders out of the box." />
          <Feature icon={<Sparkles className="h-5 w-5" strokeWidth={1.5} />} title="API & integrations" body="Drive, Dropbox, email-to-inbox, webhooks, and a clean REST API." />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Simple, page-based pricing.
          </h2>
          <p className="mt-3 text-pl-fg-dim">
            Start free. Pay only for the volume you actually process.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {(["free", "pro", "team"] as const).map((id) => {
            const plan = PLANS[id];
            return (
              <div
                key={id}
                className={`rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-[var(--pl-accent)]/60 bg-pl-surface ring-1 ring-[var(--pl-accent)]/30"
                    : "border-pl-border bg-pl-surface"
                }`}
              >
                <div className="text-sm uppercase tracking-wider text-pl-fg-dim">{plan.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-[var(--font-display)] text-4xl font-semibold">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-pl-fg-dim">/mo</span>
                </div>
                <p className="mt-2 text-sm text-pl-fg-dim">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-2 inline-block h-1 w-1 rounded-full bg-[var(--pl-accent)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === "free" ? "/sign-up" : `/sign-up?plan=${plan.id}`}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium ${
                    plan.highlight
                      ? "bg-[var(--pl-accent)] text-white hover:opacity-90"
                      : "border border-pl-border hover:bg-pl-surface-2"
                  }`}
                >
                  {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-pl-border bg-pl-surface p-5 text-sm text-pl-fg-dim">
          Need more? <Link href="/contact" className="text-pl-fg underline-offset-2 hover:underline">Talk to us about Enterprise</Link>{" "}
          for custom volume, SSO, DPA, and dedicated support.
        </div>
      </section>

      <footer className="mt-auto border-t border-pl-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-pl-fg-dim md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Paperline · A ShadowProductions product.</div>
          <div className="flex gap-5">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/changelog">Changelog</Link>
            <Link href="/status">Status</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-pl-bg p-6">
      <div className="text-[var(--pl-accent)]">{icon}</div>
      <div className="mt-3 font-medium">{title}</div>
      <p className="mt-1 text-sm text-pl-fg-dim">{body}</p>
    </div>
  );
}

function Field({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-pl-fg-dim">{label}</span>
        <span className="font-mono text-[11px] text-pl-fg-dim">{confidence}%</span>
      </div>
      <div className="mt-1">{value}</div>
      <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-[var(--pl-surface-2)]">
        <div className="h-full bg-[var(--pl-accent-2)]" style={{ width: `${confidence}%` }} />
      </div>
    </div>
  );
}
