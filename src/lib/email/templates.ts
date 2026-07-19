// =====================================================================
// Transactional email templates for Paperline.
// Keep them simple and reliable first; we can fancy them up later.
// =====================================================================

export function baseEmailHtml(opts: {
  title: string;
  intro?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  note?: string;
}) {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `
        <p style="margin:28px 0;">
          <a href="${opts.ctaUrl}" style="display:inline-block;background:#5B8DEF;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;">${opts.ctaLabel}</a>
        </p>`
      : "";

  return `
  <div style="margin:0;padding:32px;background:#0B0B0F;font-family:Inter,Arial,sans-serif;color:#F4F4F5;">
    <div style="max-width:560px;margin:0 auto;background:#14141A;border:1px solid #23232C;border-radius:20px;padding:32px;">
      <div style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#A1A1AA;margin-bottom:16px;">Paperline</div>
      <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;color:#F4F4F5;">${opts.title}</h1>
      ${opts.intro ? `<p style="margin:0 0 16px;color:#D4D4D8;font-size:16px;line-height:1.6;">${opts.intro}</p>` : ""}
      <div style="color:#E4E4E7;font-size:15px;line-height:1.7;">
        ${opts.body}
      </div>
      ${cta}
      ${opts.note ? `<p style="margin-top:24px;color:#A1A1AA;font-size:13px;line-height:1.6;">${opts.note}</p>` : ""}
    </div>
    <p style="max-width:560px;margin:16px auto 0;color:#71717A;font-size:12px;line-height:1.5;">
      Paperline is an Olvera Productions product.
    </p>
  </div>`;
}

export function welcomeEmailHtml(opts: { name?: string; dashboardUrl: string }) {
  return baseEmailHtml({
    title: `Welcome${opts.name ? `, ${opts.name}` : ""}.`,
    intro: "Your workspace is ready.",
    body: `
      <p>Paperline turns contracts, invoices, resumes, and reports into structured data and answers you can cite.</p>
      <p>Your next step is simple: upload your first document and run an extraction template.</p>
      <ul style="padding-left:18px;">
        <li>Upload a PDF</li>
        <li>Process it into searchable chunks</li>
        <li>Extract fields or chat with citations</li>
      </ul>
    `,
    ctaLabel: "Open dashboard",
    ctaUrl: opts.dashboardUrl,
    note: "If you didn’t create this account, you can safely ignore this email.",
  });
}

export function documentReadyEmailHtml(opts: {
  name?: string;
  filename: string;
  docType?: string | null;
  pageCount?: number | null;
  documentUrl: string;
}) {
  return baseEmailHtml({
    title: "Your document is ready.",
    intro: `${opts.filename} has finished processing in Paperline.`,
    body: `
      <p>You can now open the document, run an extraction template, or ask questions with citations.</p>
      <div style="margin:20px 0;padding:16px;background:#0F1115;border:1px solid #23232C;border-radius:14px;">
        <div><strong>File:</strong> ${opts.filename}</div>
        ${opts.docType ? `<div><strong>Type:</strong> ${opts.docType}</div>` : ""}
        ${typeof opts.pageCount === "number" ? `<div><strong>Pages:</strong> ${opts.pageCount}</div>` : ""}
      </div>
    `,
    ctaLabel: "Open document",
    ctaUrl: opts.documentUrl,
  });
}

export function usageWarningEmailHtml(opts: {
  workspaceName: string;
  percent: number;
  billingUrl: string;
}) {
  return baseEmailHtml({
    title: "You’re nearing your monthly usage limit.",
    intro: `${opts.workspaceName} has used ${opts.percent}% of its monthly page allowance.`,
    body: `
      <p>Paperline will keep processing documents until the workspace reaches its plan limit.</p>
      <p>If you expect more volume this month, upgrade now so uploads don’t get blocked.</p>
    `,
    ctaLabel: "Review billing",
    ctaUrl: opts.billingUrl,
  });
}
