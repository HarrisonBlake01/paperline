# Paperline recruiter deck — claims audit

Verified: 2026-07-19 CDT

This file is the source-of-truth claims ledger for a recruiter-facing Paperline PowerPoint. It separates what is visible on the live Ops Agent page, what is backed by working repository paths, what is synthetic demo data, and what is only a documented productionization direction.

## Live artifact verification

- Live Ops Agent route: <https://paperline-xi.vercel.app/ops-agent>
- HTTP verification: returned `200` on 2026-07-14.
- Browser verification: page rendered with no missing main sections.
- Page title: `Ops Agent · Paperline · Paperline`.

Visible on the live page:

- “Paperline Ops Agent turns documents into verified operations.”
- Two synthetic documents: a master services agreement and vendor invoice.
- Four cited fields with values, confidence labels, quoted snippets, document names, and page references.
- Three recommended actions with owners and approval states.
- A `$6.00` **Stripe test-mode** usage preview for 20 processed pages.
- Explicit copy that spend/provisioning is waiting for human approval.
- A displayed Hermes operator trace.
- An NVIDIA panel titled **Secure runtime path**.
- A visible badge reading **NemoClaw/OpenShell secure path**.
- Explicit demo-safe language describing sample fixtures, Stripe test mode, and approval boundaries.

## Synthetic demo facts

Source: `src/lib/ops-agent-demo.ts`

The following are static fixtures for the demo route, not live customer or production-agent outputs:

- `Northstar Supply Co.`
- `Northstar-MSA-2026.pdf`
- `INV-1048-Atlas-OCR.pdf`
- `$2,850.00` invoice total
- `Feb 15, 2026` payment due date
- `12 months with auto-renewal`
- confidence labels `98%`, `96%`, `93%`, and `91%`
- recommended action states
- Hermes action-log entries
- 20 processed pages and `$6.00 usage preview`
- the NVIDIA secure-runtime story

Presentation rule: describe these as **synthetic demo fixtures used to illustrate the workflow**. Never present them as a real customer, live extraction run, measured model confidence, real payment, real savings, or external action.

## Repository-backed product capabilities

The repository contains implementation paths for:

- Authenticated Next.js application and API routes.
- Clerk identity plus workspace membership/role resolution.
- Private document upload/storage using Supabase.
- PDF, DOCX, text, image, and scan parsing/OCR-assisted processing paths.
- Page-aware chunking and embeddings.
- PostgreSQL/pgvector retrieval.
- Runtime-validated schema-guided extraction.
- Retrieval chat with page/snippet citation data.
- Persisted workflow/item/extraction records; current workflow execution is synchronous.
- Stripe Checkout and customer-portal routes.
- Signature-verified Stripe webhook subscription synchronization.
- Synthetic offline extraction evaluation and deterministic scoring.
- A locally implemented authenticated Streamable HTTP MCP boundary with four bounded read-only tools, scoped/expiring credentials, tenant binding, rate limits, and official-SDK protocol tests.

Evidence map:

- `src/lib/pipeline/index.ts`
- `src/lib/parsing/`
- `src/lib/ai/ocr.ts`
- `src/lib/ai/extract.ts`
- `src/lib/ai/chat.ts`
- `src/lib/auth/workspace.ts`
- `src/app/api/workflows/route.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_rls.sql`
- `src/app/api/mcp/route.ts`
- `src/lib/mcp/`
- `scripts/validate-mcp.ts`
- `supabase/migrations/0013_agent_credentials.sql`

Presentation rule: say **the repository includes these paths** or **Paperline is built around these capabilities**. Do not imply that the static Ops Agent page executes all of them live during the demo.

## Extraction-evaluation claims

The repository includes three synthetic document cases and 20 labeled fields. Against deliberately imperfect sample predictions, the deterministic scorer reports:

- Exact field accuracy: `40.00%` (`8/20`)
- Type-aware normalized field accuracy: `75.00%` (`15/20`)
- Presence precision/recall/F1: `94.12% / 94.12% / 94.12%`
- List-item precision/recall/F1: `85.71% / 85.71% / 85.71%`

Presentation rule: these values are a **sample-prediction baseline used to validate the scoring harness and expose normalization effects**. They are not production accuracy, live-model quality, customer performance, or confidence calibration.

## NVIDIA NemoClaw/OpenShell verification

### What the Paperline site says

The live page calls this an **NVIDIA secure runtime path**, not a completed integration. Its source text says NemoClaw/OpenShell is the enterprise runtime path for:

- sandboxing
- credential brokering
- network policy

The page also frames external actions as auditable and behind approval.

### What official NVIDIA sources support

Primary sources checked:

- NVIDIA NemoClaw: <https://github.com/NVIDIA/NemoClaw>
- NVIDIA OpenShell: <https://github.com/NVIDIA/OpenShell>
- NemoClaw docs: <https://docs.nvidia.com/nemoclaw/latest/>
- OpenShell docs: <https://docs.nvidia.com/openshell/latest/>

Official source-backed points:

- NemoClaw describes itself as an open-source reference stack for running always-on AI agents more safely inside OpenShell sandboxes.
- NemoClaw explicitly lists **Hermes** as a supported agent and provides a Hermes quickstart.
- NemoClaw describes routed inference, network policy, sandbox lifecycle, and hardening paths.
- OpenShell describes isolated sandboxes with filesystem, network, process, and inference policy domains.
- OpenShell starts sandboxes with minimal outbound access and supports declarative network policies.
- OpenShell documents credential-provider handling and routed inference that strips caller credentials and injects backend credentials.
- OpenShell explicitly lists **Hermes Agent via NemoClaw** as a supported path.
- OpenShell provides logs and runtime monitoring, but the recruiter deck should not turn this into a claim that Paperline currently has complete production audit tracing through OpenShell.

### Current Paperline implementation status

Paperline now contains an authenticated remote Streamable HTTP MCP endpoint, scoped/expiring credential model, four read-only document/template tools, and deterministic official-SDK tests. This supports the claim **implemented locally**.

It does **not** yet support the claim that Paperline is integrated with direct Hermes or NemoClaw/OpenShell. The remote database stops at migration 0010, the public deployment predates the MCP code, and no real Hermes client or managed sandbox has completed discovery, allowed/denied calls, credential isolation, and revocation against an approved candidate.

### Credible deck wording

Use:

> **Implemented locally, runtime verification pending:** Paperline now has one tenant-scoped, read-only Streamable HTTP MCP boundary intended for direct Hermes and NemoClaw/OpenShell-managed Hermes. Official NVIDIA documentation supports the managed Hermes path, but Paperline has not yet completed candidate deployment, OpenShell policy, credential-isolation, allowed/denied-call, or revocation evidence.

Short slide label:

> NVIDIA NemoClaw/OpenShell — prepared integration path; approved sandbox verification pending.

Do not say:

- Paperline currently runs inside NemoClaw/OpenShell.
- NVIDIA secures the live Paperline deployment.
- Paperline has production-grade OpenShell audit traces.
- The demo proves credential isolation or network-policy enforcement.
- NemoClaw/OpenShell makes Paperline compliant.

## Repository gates verified

The following passed on 2026-07-14:

- `pnpm test:templates`
- `pnpm test:extraction-eval`
- `pnpm test:demo`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

The build generated `/ops-agent` successfully.

## Unsupported claims to prohibit

- Any customer count, adoption, conversion, revenue, savings, time reduction, or business outcome.
- Any production latency, throughput, uptime, or model-accuracy claim.
- Any assertion that the Ops Agent route runs live Hermes jobs.
- Any assertion that the route performs real billing, payment, provisioning, reminders, or outbound emails.
- Any assertion that Inngest orchestration, Sentry/PostHog dashboards, persisted approval state machines, or NemoClaw/OpenShell isolation are fully wired.
- Any assertion that the current public deployment, a real Hermes client, or a NemoClaw/OpenShell sandbox has used the local Paperline MCP implementation.
- Any assertion that Paperline is listed in or reviewed for a Nous MCP catalog.
- Any HIPAA, SOC 2, legal, security certification, or regulatory-compliance claim.
- Any invented recruiter quote, user testimonial, customer logo, benchmark comparison, or competitor ranking.
