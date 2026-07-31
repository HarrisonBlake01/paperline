import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status",
  description: "Current Paperline service status and launch notes.",
};

const checks = [
  { label: "Marketing site", value: "This page loaded" },
  { label: "Authentication", value: "Not continuously monitored" },
  { label: "Document processing", value: "Not verified by this page" },
  { label: "AI extraction and chat", value: "Not verified by this page" },
  { label: "Billing", value: "Not verified by this page" },
];

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-pl-bg text-pl-fg">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-pl-fg-dim hover:text-pl-fg">
          ← Back to Paperline
        </Link>
        <p className="mt-10 text-sm font-medium uppercase tracking-[0.24em] text-[var(--pl-accent)]">
          Paperline operations
        </p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Status
        </h1>
        <p className="mt-4 text-sm text-pl-fg-dim">
          Paperline exposes separate liveness and protected dependency-readiness checks, but this page is not connected to continuous monitoring or an incident-management service.
        </p>

        <section className="mt-8 rounded-3xl border border-pl-border bg-pl-surface p-6">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">
              Live status is not currently monitored
            </h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-pl-fg-dim">
            The recruiter demo is an early product. A successful page load proves only this public route responded; it does not verify authentication, document processing, AI providers, storage, or Stripe test-mode billing.
          </p>
        </section>

        <div className="mt-6 grid gap-3">
          {checks.map((check) => (
            <div key={check.label} className="flex flex-col justify-between gap-2 rounded-2xl border border-pl-border bg-pl-surface p-5 sm:flex-row sm:items-center">
              <div className="font-medium">{check.label}</div>
              <div className="text-sm text-pl-fg-dim">{check.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
