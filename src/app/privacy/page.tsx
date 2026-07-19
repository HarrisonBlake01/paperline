import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Paperline, an Olvera Productions product.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account information such as name, email address, organization, authentication identifiers, and workspace settings.",
      "Documents and content you upload, including file names, extracted text, document metadata, extraction templates, prompts, chat messages, citations, generated answers, and workflow results.",
      "Usage and technical data such as browser, device, IP address, pages visited, feature usage, logs, error reports, billing status, and approximate timestamps.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "To provide the Paperline service: authentication, upload handling, OCR/parsing, extraction, search, citation, chat, templates, billing, support, security, and abuse prevention.",
      "To improve Paperline by debugging failures, measuring product usage, improving reliability, and understanding which workflows are useful.",
      "To communicate product, security, account, support, and billing information.",
    ],
  },
  {
    title: "AI and document processing",
    body: [
      "Paperline may send portions of documents, extracted text, prompts, templates, or user questions to AI and document-processing providers so the service can parse, extract, summarize, classify, embed, or answer with citations.",
      "Do not upload documents unless you are comfortable processing them through the product and its configured providers. Avoid uploading highly sensitive regulated data unless a separate written agreement and required controls are in place.",
    ],
  },
  {
    title: "Third-party providers",
    body: [
      "Paperline may use vendors for hosting, database storage, authentication, payments, email delivery, analytics, error monitoring, AI processing, and file processing.",
      "Examples may include services such as Vercel, Supabase, Clerk, Stripe, Resend, Sentry, PostHog, OpenAI, or similar providers depending on the active deployment configuration.",
    ],
  },
  {
    title: "Sharing and disclosure",
    body: [
      "We do not sell your documents. We share information only as needed to operate Paperline, comply with law, enforce terms, protect rights and safety, support a business transfer, or with your direction.",
      "Workspace members may be able to see documents, templates, extracted fields, chats, and settings according to their role and product configuration.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "Paperline keeps account, workspace, billing, logs, and document data for as long as needed to provide the service, meet legal or security obligations, resolve disputes, and maintain backups.",
      "Where supported, you may delete documents or request account/workspace deletion. Backup and log copies may persist for a limited period before automatic deletion.",
    ],
  },
  {
    title: "Security",
    body: [
      "Paperline is designed with security-conscious handling for business documents, including authenticated workspaces and controlled access patterns.",
      "No system is perfectly secure. You are responsible for using strong account security and only uploading documents you are authorized to process.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can choose what documents to upload, update workspace information where the product allows, opt out of non-essential communications where offered, and request help with data access or deletion.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy as Paperline changes. The updated date on this page will show the latest version.",
    ],
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-pl-fg-dim">Last updated: June 22, 2026</p>
        <p className="mt-6 rounded-2xl border border-pl-border bg-pl-surface p-5 text-sm leading-7 text-pl-fg-dim">
          This starter privacy policy explains how Paperline, an Olvera Productions product, handles account data, documents, and product usage information. It should be reviewed by qualified counsel before final public launch.
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
      </div>
    </main>
  );
}
