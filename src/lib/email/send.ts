// =====================================================================
// Resend wrapper.
// =====================================================================

import { Resend } from "resend";
import {
  documentReadyEmailHtml,
  usageWarningEmailHtml,
  welcomeEmailHtml,
} from "@/lib/email/templates";

let client: Resend | null = null;

function getResend() {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Missing RESEND_API_KEY.");
    client = new Resend(key);
  }
  return client;
}

function getFromAddress() {
  return process.env.EMAIL_FROM || "Paperline <harrison@olveraproductions.com>";
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}) {
  const resend = getResend();
  return resend.emails.send({
    from: getFromAddress(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    tags: opts.tags,
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name?: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`;
  return sendEmail({
    to: opts.to,
    subject: "Welcome to Paperline",
    html: welcomeEmailHtml({ name: opts.name, dashboardUrl }),
    tags: [
      { name: "type", value: "welcome" },
      { name: "app", value: "paperline" },
    ],
  });
}

export async function sendDocumentReadyEmail(opts: {
  to: string;
  name?: string;
  documentId: string;
  filename: string;
  docType?: string | null;
  pageCount?: number | null;
}) {
  const documentUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/documents/${opts.documentId}`;
  return sendEmail({
    to: opts.to,
    subject: `${opts.filename} is ready in Paperline`,
    html: documentReadyEmailHtml({
      name: opts.name,
      filename: opts.filename,
      docType: opts.docType,
      pageCount: opts.pageCount,
      documentUrl,
    }),
    tags: [
      { name: "type", value: "document_ready" },
      { name: "app", value: "paperline" },
    ],
  });
}

export async function sendUsageWarningEmail(opts: {
  to: string;
  workspaceName: string;
  percent: number;
}) {
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings/billing`;
  return sendEmail({
    to: opts.to,
    subject: `Paperline usage at ${opts.percent}%`,
    html: usageWarningEmailHtml({
      workspaceName: opts.workspaceName,
      percent: opts.percent,
      billingUrl,
    }),
    tags: [
      { name: "type", value: "usage_warning" },
      { name: "app", value: "paperline" },
    ],
  });
}
