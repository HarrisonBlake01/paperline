# Paperline — Interview-Ready Case Study

## One-line pitch

Paperline is a full-stack AI document-intelligence SaaS that turns uploaded business documents into structured, cited, reviewable outputs while keeping consequential actions behind explicit human approval.

## The problem

Document-heavy teams often receive answers from AI without enough evidence, structure, or operational context to trust them. A useful system needs to ingest mixed file types, preserve tenant boundaries, cite source pages, validate extracted fields, surface uncertainty, and make the next action clear without silently acting on the user's behalf.

## What I built

Paperline combines:

- Next.js 16, React 19, TypeScript, and Tailwind for the product interface
- Clerk authentication and workspace membership checks
- Supabase/PostgreSQL, private storage, pgvector retrieval, and RLS-aware data design
- PDF, DOCX, text, image, and scanned-document parsing with OCR fallback
- Schema-guided extraction and grounded document chat with page/snippet citations
- Reusable extraction templates and persisted workflow records
- Stripe Checkout, customer portal, and signature-verified subscription webhooks
- Demo/readiness validation plus a synthetic offline extraction evaluation set
- Security engineering artifacts: threat model, tenant-integrity migration, upload validation, dependency remediation, browser hardening, and regression checks
- Risk-based QA evidence across HTTP contracts, browser console, mobile emulation, and automated accessibility audits
- A local tenant-scoped Streamable HTTP MCP boundary with digest-only scoped credentials, four read-only tools, durable request limits, safe audit metadata, and official-SDK protocol tests

The dedicated Ops Agent demo shows the product story in one surface: invoice and contract inputs → cited fields → recommended actions → human approval boundary → Stripe test-mode usage preview → operator trace → secure-runtime direction.

## My engineering decisions

### Evidence before automation

The interface exposes quoted source text, page references, and confidence indicators before showing recommended actions. The goal is to make model output inspectable, not to disguise it as deterministic truth.

### Deterministic boundaries around AI

Templates and extraction shapes are runtime-validated. Authentication, workspace authorization, usage limits, billing, persistence, and approval rules remain deterministic application concerns; model judgment is used for classification, extraction, OCR-assisted flows, and grounded answers.

### Human control for consequential actions

The Ops Agent can prepare an invoice approval, renewal reminder, vendor clarification draft, and billing/provisioning preview, but the demo explicitly pauses spend and external changes pending approval.

### Honest capability boundaries

The current repository supports working document, extraction, retrieval, workflow-record, auth, billing, protected readiness, and local MCP paths. The hackathon Ops Agent actions and $6 preview use synthetic fixtures. Real direct-Hermes invocation, persisted approval state machines, Inngest retries/resume, fully instrumented Sentry/PostHog dashboards, and NemoClaw/OpenShell isolation remain external verification or productionization work—not claimed as completed integrations.

### Security and release engineering as product work

I treated tenant isolation, parser boundaries, provider failures, dependency advisories, billing metadata, browser controls, and rollback as part of the product—not a last-minute checklist. The review produced a repository-backed threat model, a prioritized findings ledger, a cross-tenant RLS hardening migration, behavioral upload tests, a safe-by-default Stripe mode, and a release no-go decision where external evidence is still missing.

### Debugging the serverless parser instead of trusting the build

The existing deployed processing path had failed on PDF canvas/DOMMatrix support even though local static gates passed. I separated module import from parser execution, lazy-loaded native PDF dependencies, replaced a macOS-only scanned-PDF renderer, externalized the native packages for Next.js tracing, and added a real text-plus-render runtime gate. The remaining conclusion is deliberately conservative: local parse/render evidence is not Vercel evidence, so representative candidate uploads remain a release blocker.

### One authorization boundary for browser and agents

Rather than add a Hermes-specific service-role backdoor, I built one Paperline MCP boundary that derives the user/workspace from a digest-only credential and rechecks scope, expiry, revocation, membership, role validity, and plan. Every repository query applies that derived workspace. The same endpoint is designed for direct Hermes headers and OpenShell-managed credential replacement, but those integrations remain **Prepared / external verification required** until a real client and approved sandbox pass end to end.

## Architecture

See [`architecture.md`](./architecture.md) for the Mermaid system diagram, trust boundaries, end-to-end data flow, and repository evidence map.

## Evaluation

The repository includes a small privacy-safe regression harness with three synthetic documents and 20 labeled fields. Against the bundled deliberately imperfect sample predictions, it reports:

- **40.00%** exact field accuracy
- **75.00%** type-aware normalized field accuracy
- **94.12%** presence F1
- **85.71%** list-item F1

These are offline sample-baseline metrics—not claims about live production model quality. The harness gives future model/prompt changes a deterministic contract and a place to add real benchmark cases safely.

Run it with:

```bash
pnpm test:extraction-eval
```

## Verification completed

```bash
pnpm test:extraction-eval
pnpm test:demo
pnpm test:security
pnpm test:readiness
pnpm test:parser-runtime
pnpm test:mcp
pnpm lint
pnpm build
```

The original four-command portfolio gate passed on 2026-07-14. On 2026-07-18, the expanded local gate also passed the new security regression script, lint, and Next.js 16.2.10 production build. Lighthouse accessibility findings on the landing, auth, and Ops Agent routes were remediated to 1.00 for the audited public routes. A Clerk development-key warning remains an explicit production blocker, and the signed-in two-workspace SaaS matrix still requires controlled credentials.

## Portfolio artifacts

- 2:16 narrated walkthrough: `paperline-ops-agent-walkthrough.mp4`
- Architecture: `architecture.md`
- Production/claims notes: `walkthrough-production-notes.md`
- Full-page capture: `screenshots/ops-agent-fullpage.png`
- Hero screenshot: `screenshots/01-ops-agent-hero.png`
- Citations and approvals: `screenshots/02-cited-extraction-approvals.png`
- Billing, trace, and security path: `screenshots/03-billing-trace-security.png`

## What I would improve next

1. Connect the evaluation harness to captured live extraction outputs and expand the labeled set by document type.
2. Add durable background execution with retries, idempotency, resume, and dead-letter handling.
3. Persist approval policies and action state transitions.
4. Wire end-to-end traces, cost/latency dashboards, and alerting.
5. Apply and negative-test the tenant-integrity migration, then add durable webhook replay and denial-of-wallet controls.
6. Deploy an approved candidate, apply migrations 0011–0013, and prove direct Hermes plus NemoClaw/OpenShell credential isolation, allowed/denied calls, and revocation.

## Interview talking points

See [`interview-talking-points.md`](./interview-talking-points.md) for a recruiter screen, technical deep dive, tradeoffs, follow-up questions, and concise STAR-style stories.

## Sixty-second interview answer

> I built Paperline to solve the gap between AI reading a document and a team safely acting on it. It ingests PDFs, DOCX files, scans, and images; parses or OCRs them; stores page-aware chunks in PostgreSQL with pgvector; and returns structured extraction results or grounded answers with citations. The system includes Clerk workspaces, Supabase storage and data boundaries, reusable schemas, persisted workflow records, and Stripe billing paths. My Ops Agent demo shows how cited invoice and contract facts become approval-ready actions while spend and external changes stay paused. I also added a small synthetic eval harness so extraction changes can be measured rather than judged only by screenshots. I am careful to distinguish the working product paths from simulated hackathon actions and planned durability, observability, and secure-runtime integrations.
