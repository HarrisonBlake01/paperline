import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Recent Paperline product updates.",
};

const entries = [
  {
    date: "July 31, 2026",
    title: "Recruiter-demo documentation review",
    items: [
      "Clarified Harrison Olvera's role and Paperline's sole-proprietor operating status.",
      "Tightened AI, security, billing, monitoring, and demo claims to match repository and release evidence.",
      "Kept the public recruiter demo distinct from the deferred commercial release.",
    ],
  },
  {
    date: "June 22, 2026",
    title: "Legal and ownership cleanup",
    items: [
      "Updated Paperline ownership language to Olvera Productions.",
      "Published Terms of Service and Privacy Policy pages.",
      "Added lightweight Status and Changelog pages so footer links resolve cleanly.",
    ],
  },
  {
    date: "June 2026",
    title: "Ops Agent demo slice",
    items: [
      "Added a cited extraction and approvals demo flow for invoices, contracts, spend review, and safe agent handoff.",
      "Documented sample job and result payloads for app-to-agent workflows.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-pl-bg text-pl-fg">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-pl-fg-dim hover:text-pl-fg">
          ← Back to Paperline
        </Link>
        <p className="mt-10 text-sm font-medium uppercase tracking-[0.24em] text-[var(--pl-accent)]">
          Paperline updates
        </p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Changelog
        </h1>
        <p className="mt-4 text-sm text-pl-fg-dim">
          Product notes for Paperline, an Olvera Productions product.
        </p>

        <div className="mt-10 space-y-6">
          {entries.map((entry) => (
            <article key={`${entry.date}-${entry.title}`} className="rounded-2xl border border-pl-border bg-pl-surface p-6">
              <p className="text-sm text-pl-fg-dim">{entry.date}</p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight">
                {entry.title}
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-pl-fg-dim">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
