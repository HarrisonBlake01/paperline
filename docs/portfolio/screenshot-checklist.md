# Paperline Portfolio Screenshot Checklist

## Current approved internal captures

All current captures use synthetic Ops Agent fixtures and contain no customer documents or secrets.

### 1. Hero and workflow overview

File: `screenshots/01-ops-agent-hero.png`

Shows:

- Paperline Ops Agent value proposition
- synthetic two-document operations job
- Upload → Extract → Approve → Operate flow
- Hermes, Stripe test-mode, and NemoClaw/OpenShell labels

Use for: resume packet, portfolio card, case-study opener.

### 2. Cited extraction and human approval

File: `screenshots/02-cited-extraction-approvals.png`

Shows:

- invoice total and payment date
- contract term and renewal risk
- confidence indicators
- quoted evidence and page-level source labels
- human-owned recommended actions and states

Use for: interviews about trustworthy AI, HITL UX, and source grounding.

### 3. Billing, trace, and secure-runtime direction

File: `screenshots/03-billing-trace-security.png`

Shows:

- Stripe test-mode usage preview
- explicit waiting-for-human-approval warning
- Hermes operator trace
- NVIDIA NemoClaw/OpenShell secure-runtime path
- demo-safe closing statement

Use for: interviews about approvals, auditability, billing boundaries, and productionization.

## Before public or recruiter sharing

- [ ] Confirm every document/company name is synthetic.
- [ ] Confirm Stripe is visibly described as **test mode**.
- [ ] Confirm no real payment, provisioning, or outbound action is implied.
- [ ] Confirm NemoClaw/OpenShell is described as a path or planned integration—not a verified production deployment.
- [ ] Confirm no HIPAA, SOC 2, legal-compliance, customer, revenue, or performance claim appears.
- [ ] Confirm the browser contains no local URLs, tokens, environment values, account email, notifications, or unrelated tabs.
- [ ] Confirm each image remains readable at portfolio-card and full-screen sizes.
- [ ] Add concise alt text when publishing.

## Recommended alt text

- **Hero:** “Paperline Ops Agent interface showing a synthetic invoice-and-contract job and a four-stage upload, extract, approve, operate workflow.”
- **Evidence:** “Paperline cited extraction cards with confidence scores, quoted source evidence, and human-owned recommended actions.”
- **Operations:** “Paperline test-mode billing preview, approval warning, Hermes operator trace, and secure-runtime architecture direction.”

## Capture refresh procedure

1. Run `pnpm test:demo`, `pnpm lint`, and `pnpm build`.
2. Start the local app and open `/ops-agent` at a 1440×900 viewport.
3. Verify the browser console has no JavaScript errors.
4. Capture a full-page image, then create consistent 16:9 crops.
5. Review every crop against the public-sharing checklist above.
6. Update `walkthrough-production-notes.md` if claims, labels, duration, or framing change.
