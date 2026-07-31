import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { PaperlineMark } from "@/components/paperline-mark";

export const metadata = {
  title: "Contact · Paperline",
  description: "Contact Paperline about product questions, security reports, or deployment review.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-[var(--font-display)] text-lg font-semibold"
      >
        <PaperlineMark className="h-5 w-5" />
        paperline
      </Link>

      <p className="mt-12 text-sm font-medium uppercase tracking-[0.2em] text-[var(--pl-accent)]">
        Contact
      </p>
      <h1 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
        Talk with the person building Paperline.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-pl-fg-dim">
        Paperline is a recruiter-demo product built and operated by Harrison Olvera
        as an unregistered sole proprietor under the Olvera Productions brand. Use
        the contact below for
        product questions, recruiter or engineering review, and responsible
        security reports. Do not include private documents, credentials, or
        sensitive customer information in email.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:harrison@olveraproductions.com?subject=Paperline%20inquiry"
          className="rounded-2xl border border-pl-border bg-pl-surface p-5 transition hover:border-[var(--pl-accent)]/50"
        >
          <Mail className="h-5 w-5 text-[var(--pl-accent)]" />
          <h2 className="mt-4 font-medium">Product and technical review</h2>
          <p className="mt-2 text-sm leading-6 text-pl-fg-dim">
            harrison@olveraproductions.com
          </p>
        </a>
        <a
          href="mailto:harrison@olveraproductions.com?subject=Paperline%20security%20report"
          className="rounded-2xl border border-pl-border bg-pl-surface p-5 transition hover:border-[var(--pl-accent)]/50"
        >
          <ShieldCheck className="h-5 w-5 text-[var(--pl-accent)]" />
          <h2 className="mt-4 font-medium">Responsible security disclosure</h2>
          <p className="mt-2 text-sm leading-6 text-pl-fg-dim">
            Include the affected route and safe reproduction steps—never live
            secrets or customer files.
          </p>
        </a>
      </section>

      <Link
        href="/"
        className="mt-10 inline-flex text-sm text-pl-fg underline underline-offset-4"
      >
        ← Back to Paperline
      </Link>
    </main>
  );
}
