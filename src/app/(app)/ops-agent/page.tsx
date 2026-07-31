import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  actionLog,
  extractedFields,
  opsAgentJob,
  recommendedActions,
  securityStory,
  stripePreview,
} from "@/lib/ops-agent-demo";

export const metadata = {
  title: "Ops Agent · Paperline",
  description:
    "Synthetic Paperline Ops Agent demo for cited document extraction, approval boundaries, and Stripe test-mode billing.",
};

const workflowSteps = [
  { label: "Upload", detail: "2 docs", icon: FileText },
  { label: "Extract", detail: "4 cited facts", icon: FileCheck2 },
  { label: "Approve", detail: "human gate", icon: Clock3 },
  { label: "Operate", detail: "Stripe test mode", icon: CreditCard },
] as const;

export default function OpsAgentPage() {
  return (
    <main className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-x-4 top-0 -z-10 h-96 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--pl-accent)_20%,transparent),transparent_68%)] blur-3xl" />

      <section className="relative overflow-hidden rounded-[2rem] border border-pl-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--pl-surface)_92%,white_8%),var(--pl-bg))] p-5 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--pl-accent)]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-64 rounded-full bg-[var(--pl-accent-2)]/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-pl-border bg-pl-bg/70 px-3 py-1 text-xs text-pl-fg-dim shadow-inner shadow-white/5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" strokeWidth={1.7} />
              Hermes Accelerated Business Hackathon demo
            </p>
            <h1 className="mt-5 max-w-3xl text-balance font-[var(--font-display)] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Paperline Ops Agent turns cited document facts into reviewable next steps.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-pl-fg-dim sm:text-lg">
              Upload invoices and contracts, extract cited facts, generate approval-ready follow-up, and keep Stripe-backed spend or provisioning behind a human approval boundary.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <Badge icon={Bot}>Hermes Agent operator</Badge>
              <Badge icon={CreditCard}>Stripe test-mode operation</Badge>
              <Badge icon={ShieldCheck}>NemoClaw/OpenShell planned path</Badge>
            </div>
          </div>

          <div className="relative rounded-3xl border border-pl-border bg-pl-bg/80 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-5">
            <div className="absolute -left-3 top-8 hidden h-16 w-16 rounded-2xl border border-[var(--pl-accent)]/30 bg-[var(--pl-accent)]/10 text-[var(--pl-accent)] shadow-xl shadow-[var(--pl-accent)]/10 lg:flex lg:items-center lg:justify-center">
              <Bot className="h-7 w-7" strokeWidth={1.6} />
            </div>

            <div className="rounded-2xl border border-pl-border bg-[linear-gradient(180deg,var(--pl-surface),color-mix(in_srgb,var(--pl-surface)_70%,var(--pl-bg)))] p-4">
              <div className="flex items-start justify-between gap-4 border-b border-pl-border pb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-pl-fg-dim">
                    Operations job
                  </div>
                  <div className="mt-1 font-[var(--font-display)] text-2xl font-semibold leading-tight">
                    {opsAgentJob.workspace}
                  </div>
                </div>
                <span className="rounded-full border border-[var(--pl-accent)]/25 bg-[var(--pl-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--pl-accent)]">
                  Ready for review
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {opsAgentJob.documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="group flex items-center gap-3 rounded-2xl border border-pl-border bg-pl-bg/70 px-3 py-3 transition hover:border-[var(--pl-accent)]/40"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pl-accent)]/15 text-[var(--pl-accent)]">
                      <FileText className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{doc.name}</div>
                      <div className="mt-0.5 text-xs text-pl-fg-dim">
                        {doc.type} · {doc.pages} pages
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--pl-success)]" strokeWidth={1.8} />
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-pl-border bg-pl-bg/50 p-3">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-pl-fg-dim">
                  <Zap className="h-3.5 w-3.5 text-[var(--pl-accent-2)]" strokeWidth={1.7} />
                  Synthetic workflow trace
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {workflowSteps.map((step, index) => (
                    <WorkflowStep
                      key={step.label}
                      detail={step.detail}
                      icon={step.icon}
                      index={index + 1}
                      label={step.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Documents" value="2" detail="invoice + contract" />
        <Metric label="Cited fields" value="4" detail="with source snippets" />
        <Metric label="Agent actions" value="3" detail="approval-ready" />
        <Metric label="Billing preview" value="$6.00" detail="Stripe test mode" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel eyebrow="Cited extraction" title="Facts with receipts" icon={FileCheck2} accent>
          <div className="grid gap-4 sm:grid-cols-2">
            {extractedFields.map((field) => (
              <article
                key={field.label}
                className="rounded-2xl border border-pl-border bg-pl-bg/55 p-4 transition hover:-translate-y-0.5 hover:border-[var(--pl-accent)]/35 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-pl-fg-dim">
                      {field.label}
                    </div>
                    <div className="mt-1 text-balance font-[var(--font-display)] text-2xl font-semibold tracking-tight">
                      {field.value}
                    </div>
                  </div>
                  <span className="rounded-full border border-[var(--pl-success)]/20 bg-[var(--pl-success)]/15 px-2.5 py-1 text-xs text-[var(--pl-success)]">
                    {field.confidence}
                  </span>
                </div>
                <blockquote className="mt-4 border-l-2 border-[var(--pl-accent)] pl-3 text-sm leading-6 text-pl-fg-dim">
                  “{field.quote}”
                </blockquote>
                <div className="mt-4 inline-flex rounded-full border border-pl-border bg-pl-surface/70 px-2.5 py-1 font-mono text-[11px] text-pl-fg-dim">
                  {field.citation}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Human approval boundary" title="Recommended actions" icon={Clock3}>
          <div className="space-y-3">
            {recommendedActions.map((action, index) => (
              <div
                key={action.title}
                className="rounded-2xl border border-pl-border bg-pl-bg/55 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pl-accent)]/15 font-mono text-xs text-[var(--pl-accent)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-medium leading-snug">{action.title}</div>
                        <div className="mt-1 text-xs text-pl-fg-dim">{action.owner}</div>
                      </div>
                      <span className="rounded-full border border-[var(--pl-warning)]/20 bg-[var(--pl-warning)]/15 px-2.5 py-1 text-[11px] text-[var(--pl-warning)]">
                        {action.state}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-pl-fg-dim">
                      {action.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel eyebrow="Stripe" title="Test-mode business operation" icon={CreditCard}>
          <dl className="space-y-3 text-sm">
            <KeyValue label="Mode" value={stripePreview.mode} />
            <KeyValue label="Customer" value={stripePreview.customer} />
            <KeyValue label="Usage" value={stripePreview.usage} />
            <KeyValue label="Preview" value={stripePreview.estimatedCharge} />
          </dl>
          <div className="mt-5 rounded-2xl border border-[var(--pl-warning)]/30 bg-[linear-gradient(135deg,var(--pl-warning)_0%,transparent_1px),color-mix(in_srgb,var(--pl-warning)_12%,transparent)] p-4 text-sm leading-6 text-[var(--pl-warning)]">
            {stripePreview.approvalState}: the agent prepares the billing/provisioning step, but does not spend without approval.
          </div>
        </Panel>

        <Panel eyebrow="Hermes action log" title="Operator trace" icon={Bot}>
          <ol className="relative space-y-4 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-px before:bg-pl-border">
            {actionLog.map((event, index) => (
              <li key={event} className="relative flex gap-3 text-sm leading-6 text-pl-fg-dim">
                <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--pl-accent)]/25 bg-[var(--pl-accent)]/15 font-mono text-[11px] text-[var(--pl-accent)]">
                  {index + 1}
                </span>
                {event}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel eyebrow="NVIDIA" title="Secure runtime path" icon={LockKeyhole}>
          <ul className="space-y-3">
            {securityStory.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-pl-fg-dim">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--pl-accent)]" strokeWidth={1.7} />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-pl-border bg-[linear-gradient(135deg,var(--pl-surface),color-mix(in_srgb,var(--pl-accent)_10%,var(--pl-bg)))] p-5 shadow-xl shadow-black/20 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-pl-fg-dim">
              Demo close
            </p>
            <h2 className="mt-1 max-w-3xl text-balance font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
              From uploaded documents to paid, cited business actions.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-pl-fg-dim">
              This route is intentionally demo-safe: it uses sample fixtures, Stripe test-mode language, and explicit approval boundaries while showing the exact workflow Paperline can make real.
            </p>
          </div>
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pl-accent-strong)] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[var(--pl-accent)]/20">
            Demo ready for recording
            <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
          </div>
        </div>
      </section>
    </main>
  );
}

function Badge({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-pl-border bg-pl-bg/65 px-3 py-1 text-pl-fg-dim shadow-inner shadow-white/5">
      <Icon className="h-3.5 w-3.5 text-[var(--pl-accent)]" strokeWidth={1.7} />
      {children}
    </span>
  );
}

function WorkflowStep({
  detail,
  icon: Icon,
  index,
  label,
}: {
  detail: string;
  icon: LucideIcon;
  index: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-pl-border bg-pl-surface/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-[var(--pl-accent)]" strokeWidth={1.7} />
        <span className="font-mono text-[10px] text-pl-fg-dim">0{index}</span>
      </div>
      <div className="mt-2 text-sm font-medium">{label}</div>
      <div className="mt-0.5 text-xs text-pl-fg-dim">{detail}</div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-pl-border bg-pl-surface/95 p-5 shadow-lg shadow-black/10">
      <div className="text-[11px] uppercase tracking-[0.18em] text-pl-fg-dim">
        {label}
      </div>
      <div className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-sm text-pl-fg-dim">{detail}</div>
    </div>
  );
}

function Panel({
  accent = false,
  children,
  eyebrow,
  title,
  icon: Icon,
}: {
  accent?: boolean;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-pl-border bg-pl-surface/95 p-5 shadow-xl shadow-black/10 sm:p-6 ${
        accent ? "bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--pl-accent)_12%,transparent),transparent_34%),var(--pl-surface)]" : ""
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-pl-fg-dim">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--pl-accent)]/25 bg-[var(--pl-accent)]/10 text-[var(--pl-accent)]">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </div>
      </div>
      {children}
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-pl-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-pl-fg-dim">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
