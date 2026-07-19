import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Layers,
  LockKeyhole,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { PaperlineMark } from "@/components/paperline-mark";
import { PLANS } from "@/lib/plans";

const useCases = [
  {
    title: "Contracts & legal ops",
    body: "Find renewal dates, governing law, parties, obligations, and risky clauses without rereading every page.",
    prompt: "Which agreements renew in the next 60 days?",
  },
  {
    title: "Invoices & finance",
    body: "Capture vendors, totals, due dates, tax, line items, and payment terms from messy PDFs and scans.",
    prompt: "Show unpaid invoices over $2,500 by vendor.",
  },
  {
    title: "Reports & research",
    body: "Turn long reports into cited summaries, comparable fields, and searchable institutional knowledge.",
    prompt: "Summarize the key risks and cite the pages.",
  },
];

const faqs = [
  {
    question: "Can Paperline read scanned documents?",
    answer: "Yes. Paperline runs OCR when needed, then extracts structured fields and keeps citations back to the source page.",
  },
  {
    question: "Do answers include sources?",
    answer: "Every chat answer is designed to point back to the exact document passage, so users can verify before acting.",
  },
  {
    question: "Can I define my own fields?",
    answer: "Yes. Use custom extraction templates for the fields your team cares about, then reuse them across batches.",
  },
  {
    question: "What happens after the free plan?",
    answer: "You can keep testing on the free tier, then upgrade when page volume or team features matter.",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-pl-border/70 backdrop-blur supports-[backdrop-filter]:bg-pl-bg/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-[var(--font-display)] text-lg font-semibold tracking-tight">
            <PaperlineMark className="h-5 w-5 shrink-0 text-pl-fg" />
            paperline
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-pl-fg-dim md:flex">
            <Link href="#features" className="hover:text-pl-fg">Product</Link>
            <Link href="#how-it-works" className="hover:text-pl-fg">How it works</Link>
            <Link href="#use-cases" className="hover:text-pl-fg">Use cases</Link>
            <Link href="#pricing" className="hover:text-pl-fg">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-pl-fg-dim hover:text-pl-fg">Sign in</Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--pl-accent-strong)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-pl-border px-3 py-1 text-xs text-pl-fg-dim">
              <Sparkles className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" strokeWidth={1.75} />
              AI document workflows for teams that need receipts
            </p>
            <h1 className="font-[var(--font-display)] text-5xl font-semibold tracking-[-0.02em] leading-[1.05] md:text-6xl">
              Turn documents into answers you can verify.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-pl-fg-dim">
              Paperline reads your PDFs, contracts, invoices, and reports — then gives you
              structured data, summaries, and page-level citations you can trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--pl-accent-strong)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="#sample"
                className="rounded-xl border border-pl-border px-4 py-2.5 text-sm hover:bg-pl-surface"
              >
                View sample output
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-pl-fg-dim">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" /> No credit card required</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" /> Works with PDFs, DOCX, scans, and text</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" /> Citations included</span>
            </div>
          </div>

          {/* Hero product mock */}
          <div id="sample" className="rounded-2xl border border-pl-border bg-pl-surface p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="grid gap-2 rounded-xl bg-pl-bg p-2">
              <div className="rounded-lg border border-pl-border bg-[var(--pl-surface-2)] p-5 text-xs text-pl-fg-dim">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">Uploaded document</div>
                    <div className="mt-1 text-sm text-pl-fg">Sample contract.pdf</div>
                  </div>
                  <span className="rounded-full border border-pl-border px-2.5 py-1 text-[11px]">Page 12 of 45</span>
                </div>

                <div className="mt-5 rounded-xl border border-pl-border bg-pl-bg p-4">
                  <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wider">
                    <span>Original text</span>
                    <span className="text-[var(--pl-accent-2)]">Source found</span>
                  </div>
                  <p className="leading-relaxed text-pl-fg">
                    “The initial term shall begin on January 14, 2026 and continue for twelve months...”
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--pl-accent)]/30 bg-[var(--pl-accent)]/10 p-3 text-pl-fg">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--pl-accent-2)]" strokeWidth={1.75} />
                  <span>Paperline reads the document and pulls out the key details below.</span>
                </div>
              </div>
              <div className="rounded-lg border border-pl-border bg-pl-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">AI summary</div>
                    <div className="mt-1 font-medium">Key contract details</div>
                  </div>
                  <span className="rounded-full bg-[var(--pl-accent-strong)] px-2.5 py-1 text-[11px] font-medium text-white">Ready to review</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <Field label="Who is involved" value="Acme Corp and Globex LLC" confidence={97} />
                  <Field label="Start date" value="January 14, 2026" confidence={94} />
                  <Field label="Contract length" value="12 months, then auto-renews" confidence={88} />
                  <Field label="Governing law" value="State of Delaware" confidence={92} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-pl-border bg-pl-border md:grid-cols-4">
          <Stat value="4" label="common file types" />
          <Stat value="Page" label="level source citations" />
          <Stat value="Custom" label="extraction templates" />
          <Stat value="Team" label="workspaces ready" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wider text-pl-fg-dim">Product</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Everything you need to ship document workflows.
          </h2>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-pl-border bg-pl-border md:grid-cols-3">
          <Feature icon={<FileText className="h-5 w-5" strokeWidth={1.5} />} title="Upload anything" body="PDFs, DOCX, scans, invoices. We handle parsing and OCR." />
          <Feature icon={<Layers className="h-5 w-5" strokeWidth={1.5} />} title="Extract structured data" body="Built-in patterns for invoices, contracts, resumes, and reports." />
          <Feature icon={<MessageSquare className="h-5 w-5" strokeWidth={1.5} />} title="Chat with citations" body="Every answer cites the exact page and passage." />
          <Feature icon={<Zap className="h-5 w-5" strokeWidth={1.5} />} title="Custom templates" body="Define your own fields and run them across batches of docs." />
          <Feature icon={<Users className="h-5 w-5" strokeWidth={1.5} />} title="Team workspaces" body="Keep documents, templates, and results organized by workspace." />
          <Feature icon={<Sparkles className="h-5 w-5" strokeWidth={1.5} />} title="API-ready foundation" body="Built for future Drive, Dropbox, email, webhook, and REST workflows." />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-wider text-pl-fg-dim">How it works</p>
            <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
              From upload to usable data in three steps.
            </h2>
            <p className="mt-3 text-pl-fg-dim">
              Curious users should not have to guess what happens after sign-up. Paperline shows a clear path from raw file to answerable knowledge.
            </p>
          </div>
          <div className="grid gap-4">
            <Step icon={<Upload className="h-5 w-5" strokeWidth={1.5} />} title="1. Upload documents" body="Drop in PDFs, DOCX files, images, or text. Paperline parses the file and runs OCR when needed." />
            <Step icon={<ClipboardCheck className="h-5 w-5" strokeWidth={1.5} />} title="2. Extract the fields that matter" body="Choose a document type or custom template, then review values with confidence scores and citations." />
            <Step icon={<Search className="h-5 w-5" strokeWidth={1.5} />} title="3. Ask questions across your files" body="Chat with one document or a workspace and get sourced answers instead of unsupported guesses." />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wider text-pl-fg-dim">Use cases</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
            Built for the documents teams actually avoid reading.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {useCases.map((useCase) => (
            <div key={useCase.title} className="rounded-2xl border border-pl-border bg-pl-surface p-6">
              <h3 className="font-medium">{useCase.title}</h3>
              <p className="mt-2 text-sm text-pl-fg-dim">{useCase.body}</p>
              <div className="mt-5 rounded-xl border border-pl-border bg-pl-bg p-3 text-sm text-pl-fg-dim">
                <span className="text-pl-fg">Ask:</span> “{useCase.prompt}”
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-pl-border bg-pl-surface p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <p className="text-sm uppercase tracking-wider text-pl-fg-dim">Trust</p>
              <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
                Designed for documents people have to verify.
              </h2>
              <p className="mt-3 text-pl-fg-dim">
                Paperline focuses on traceable output: source files stay organized, extracted fields show confidence, and answers point back to evidence.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TrustItem icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.5} />} title="Cited answers" body="Trace summaries and chat responses back to source pages." />
              <TrustItem icon={<LockKeyhole className="h-5 w-5" strokeWidth={1.5} />} title="Workspace boundaries" body="Keep team documents and templates separated by workspace." />
              <TrustItem icon={<Workflow className="h-5 w-5" strokeWidth={1.5} />} title="Repeatable workflows" body="Reuse the same extraction template instead of prompting from scratch." />
              <TrustItem icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />} title="Review before action" body="Confidence scores help users spot fields that deserve a second look." />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wider text-pl-fg-dim">Pricing</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
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
                className="rounded-2xl border border-[var(--pl-accent)]/60 bg-pl-surface p-6 ring-1 ring-[var(--pl-accent)]/30"
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
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--pl-accent-strong)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-pl-border bg-pl-surface p-5 text-sm text-pl-fg-dim">
          Need more? <Link href="/contact" className="text-pl-fg underline underline-offset-2">Talk to us about Enterprise</Link>{" "}
          for custom volume, SSO, DPA, and dedicated support.
          <span className="mt-2 block text-xs">
            Features labeled Planned are launch targets, not currently deployed integrations.
          </span>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr]">
          <div>
            <p className="text-sm uppercase tracking-wider text-pl-fg-dim">FAQ</p>
            <h2 className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
              A few answers before sign-up.
            </h2>
          </div>
          <div className="divide-y divide-pl-border rounded-2xl border border-pl-border bg-pl-surface">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-5">
                <h3 className="font-medium">{faq.question}</h3>
                <p className="mt-2 text-sm text-pl-fg-dim">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-pl-border bg-[var(--pl-accent-strong)] px-8 py-10 text-white md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">Bring one messy document. See what comes back.</h2>
              <p className="mt-2 text-sm text-white/90">Start free, upload a file, and test extraction plus cited chat in minutes.</p>
            </div>
            <Link
              href="/sign-up"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[var(--pl-accent-strong)] hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-pl-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-pl-fg-dim md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Paperline · An Olvera Productions product.</div>
          <div className="flex flex-wrap gap-5">
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-pl-surface p-5">
      <div className="font-[var(--font-display)] text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-pl-fg-dim">{label}</div>
    </div>
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

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-pl-border bg-pl-surface p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pl-accent)]/10 text-[var(--pl-accent)]">
        {icon}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-pl-fg-dim">{body}</p>
      </div>
    </div>
  );
}

function TrustItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-pl-border bg-pl-bg p-5">
      <div className="text-[var(--pl-accent)]">{icon}</div>
      <h3 className="mt-3 font-medium">{title}</h3>
      <p className="mt-1 text-sm text-pl-fg-dim">{body}</p>
    </div>
  );
}

function Field({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider text-pl-fg-dim">{label}</span>
        <span className="font-mono text-[11px] text-pl-fg-dim">{confidence}% confident</span>
      </div>
      <div className="mt-1">{value}</div>
      <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-[var(--pl-surface-2)]">
        <div className="h-full bg-[var(--pl-accent-2)]" style={{ width: `${confidence}%` }} />
      </div>
    </div>
  );
}
