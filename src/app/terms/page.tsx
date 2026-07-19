import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Paperline, an Olvera Productions product.",
};

const sections = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "By accessing or using Paperline, you agree to these Terms of Service. If you are using Paperline on behalf of an organization, you represent that you have authority to bind that organization to these terms.",
      "If you do not agree to these terms, do not use Paperline.",
    ],
  },
  {
    title: "2. What Paperline does",
    body: [
      "Paperline helps users upload documents, process them into searchable text, run extraction templates, and ask questions with citations to source material.",
      "Paperline is a document intelligence tool. It is not a law firm, accounting firm, medical provider, or regulated compliance service. Output may be incomplete or incorrect and should be reviewed before being used for legal, financial, medical, employment, or operational decisions.",
    ],
  },
  {
    title: "3. Accounts and security",
    body: [
      "You are responsible for maintaining the confidentiality of your account credentials and for activity that occurs under your account.",
      "You agree to provide accurate account information, keep your access secure, and notify us if you believe your account or workspace has been compromised.",
    ],
  },
  {
    title: "4. Your documents and content",
    body: [
      "You retain ownership of the files, prompts, templates, extracted fields, and other content you upload or create in Paperline.",
      "You grant Paperline permission to process that content only as needed to operate, secure, improve, and support the service, including parsing, OCR, extraction, search, citation, storage, billing, and support workflows.",
      "You are responsible for ensuring you have the right to upload and process the documents you submit.",
    ],
  },
  {
    title: "5. Acceptable use",
    body: [
      "Do not use Paperline to break the law, infringe others' rights, upload malicious files, attempt unauthorized access, reverse engineer protected parts of the service, overload infrastructure, or process documents you are not allowed to access.",
      "We may suspend or restrict accounts that create security, abuse, legal, billing, or platform-integrity risk.",
    ],
  },
  {
    title: "6. Plans, billing, and test-mode features",
    body: [
      "Paid plans, usage limits, page allowances, and billing intervals are shown in the product or checkout flow when available. Unless a checkout flow says otherwise, fees are billed in advance and are non-refundable except where required by law.",
      "Some demo or hackathon flows may use simulated approvals, test-mode billing, or sample data. Those flows are labeled for demonstration and do not represent real charges, real provisioning, or guaranteed production availability.",
    ],
  },
  {
    title: "7. Third-party services",
    body: [
      "Paperline may rely on third-party services for authentication, hosting, database storage, document parsing, AI processing, email delivery, analytics, error monitoring, and payments.",
      "Those providers are not controlled by Paperline, and their own terms and privacy practices may apply.",
    ],
  },
  {
    title: "8. Service changes and availability",
    body: [
      "Paperline may change, pause, remove, or improve features over time. We try to keep the service reliable, but we do not guarantee uninterrupted availability or that every document will parse perfectly.",
    ],
  },
  {
    title: "9. Disclaimers and limitation of liability",
    body: [
      "Paperline is provided on an 'as is' and 'as available' basis. To the fullest extent allowed by law, we disclaim warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, and uninterrupted operation.",
      "To the fullest extent allowed by law, Paperline and Olvera Productions will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, business interruption, or substitute services.",
    ],
  },
  {
    title: "10. Updates to these terms",
    body: [
      "We may update these terms as the product evolves. Material changes will be reflected by updating the date on this page or by another reasonable notice inside the product.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-pl-bg text-pl-fg">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-pl-fg-dim hover:text-pl-fg">
          ← Back to Paperline
        </Link>
        <p className="mt-10 text-sm font-medium uppercase tracking-[0.24em] text-[var(--pl-accent)]">
          Paperline legal
        </p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-pl-fg-dim">Last updated: June 22, 2026</p>
        <p className="mt-6 rounded-2xl border border-pl-border bg-pl-surface p-5 text-sm leading-7 text-pl-fg-dim">
          These are practical starter terms for Paperline, an Olvera Productions product. They should be reviewed by qualified counsel before relying on them as final production legal terms.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-pl-border bg-pl-surface p-6">
              <h2 className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-pl-fg-dim">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-pl-fg-dim">
          Questions about these terms? Contact the Paperline team through your normal Olvera Productions contact channel.
        </p>
      </div>
    </main>
  );
}
