# Paperline

**Paperline turns documents into structured, verifiable answers.**

It is an AI document-intelligence SaaS built by Harrison Olvera under the Paperline product brand, operated through his Olvera Productions sole proprietorship. Users upload PDFs, DOCX files, images/scans, and text; Paperline parses or OCRs them, extracts structured fields with reusable templates, and supports document chat with source citations.

**Live recruiter demo:** [paperline-demo.olveraproductions.com](https://paperline-demo.olveraproductions.com) — synthetic/test data, production Clerk authentication, and Stripe test mode only.

## Why this project matters

Paperline is designed around a practical AI-engineering problem: making LLM output useful in workflows where users need **receipts**, not just summaries. The app combines document parsing, OCR fallback, embeddings, retrieval, schema-guided extraction, test-mode billing, authentication, and multi-tenant data boundaries in a deployed recruiter-demo environment.

For recruiters and technical reviewers, the core signal is end-to-end product engineering:

- AI extraction with validated, reusable schemas
- Retrieval-augmented document chat with page-level citations
- Multi-tenant workspace model with Clerk auth and Supabase RLS-aware data design
- Supabase Postgres + pgvector storage for document chunks and semantic search
- Stripe billing for Free / Pro / Team plans
- Community template publishing, voting, copying, and starter seeded examples
- Next.js 16 App Router implementation with TypeScript, Tailwind v4, CI, and release runbooks

**Harrison Olvera’s contribution:** product architecture, full-stack implementation, AI/document pipeline, tenant and lifecycle hardening, Stripe state reconciliation, security/QA evidence, CI, and release engineering. Paperline is the product; the Ops Agent route is a supporting synthetic demonstration.

The recruiter/demo environment is available at `https://paperline-demo.olveraproductions.com` and is backed by the stable `paperline-xi.vercel.app` deployment. It uses synthetic/test data and Stripe test mode. The future commercial `paperline.io` environment is deliberately separate and remains on hold.

## Current product capabilities

### Demo workflow

The recruiter demo path is intentionally simple: sign in, upload an important document, wait for Paperline to process it, review the extracted text/details, run an extraction template, then save the same kind of review as a repeatable workflow. The app is tuned for general users first, so the interface should explain what happened and what to do next without exposing model/provider internals.

### Security and privacy posture

**Designed for sensitive documents.** Paperline treats uploaded files as private workspace data and avoids public-by-default access patterns. Protected routes resolve Clerk identity and workspace membership, while privileged server queries apply explicit workspace and role filters because the Supabase service role bypasses RLS.

Paperline applies sensitive-document threat modeling, private-storage defaults, and tenant-aware access controls, but it does **not** claim formal HIPAA, SOC 2, or legal compliance certification. See [`SECURITY.md`](./SECURITY.md) for the current security posture and pre-deployment checklist.

- Upload and process documents through a server-side pipeline
- Parse PDFs, DOCX, text, and image/scanned inputs with OCR fallback
- Classify document type and chunk extracted text for search/chat
- Generate embeddings and retrieve relevant chunks for cited answers
- Run built-in or custom extraction templates against documents
- AI-generate custom templates from existing documents
- Browse, publish, upvote, and copy community templates
- Track workspace page usage and AI template generation allowance
- Create Stripe checkout sessions and customer portal sessions
- Sync subscription state from Stripe webhooks
- Auto-provision personal workspaces from Clerk users/webhooks

The recruiter environment has production Clerk authentication, a signature-verified Clerk webhook limited to user provisioning, protected dependency-readiness checks, and verified Stripe sandbox checkout/cancellation reconciliation. Destructive document/workspace paths remain security-engineering evidence rather than a promise of unrestricted commercial production readiness.

## Starter template scenarios

Paperline ships with built-in and community templates so a new workspace can demonstrate real workflows immediately.

| Template | Scenario | How Paperline helps |
| -------- | -------- | ------------------- |
| Invoice | Finance teams reviewing vendor bills | Extracts vendor, invoice number, dates, totals, tax, currency, and line items. |
| Contract | Legal/ops teams reviewing agreements | Extracts parties, term, renewal, payment terms, governing law, obligations, and risk flags. |
| Resume | Recruiting teams screening candidates | Extracts candidate profile, contact info, skills, work history, education, and links. |
| Report | Teams analyzing long business/research documents | Extracts title, summary, findings, metrics, risks, recommendations, and cited sections. |
| Client Intake Packet | Agencies and service businesses handling new requests | Extracts client identity, requested services, deadlines, budget signals, and follow-up questions. |
| Purchase Order | Procurement and finance reconciliation | Extracts PO number, buyer/supplier, delivery dates, totals, and line items. |
| Lease Agreement | Property/legal review | Extracts parties, property address, rent, deposits, lease term, renewal, and notice requirements. |
| Meeting Notes | Teams converting notes into execution | Extracts decisions, action items, owners, due dates, blockers, and follow-up questions. |
| Medical Bill | Billing review and advocacy | Extracts provider, patient/account details, service dates, adjustments, due date, and amount due. |
| Security Questionnaire | Vendor security/compliance reviews | Extracts compliance frameworks, controls, evidence links, data handling notes, and review gaps. |

In every case, the goal is the same: transform messy documents into structured fields and grounded answers that users can verify against the source.

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Framework | Next.js 16 App Router + Turbopack |
| Language | TypeScript |
| UI | Tailwind v4, custom design tokens, Radix/shadcn primitives |
| Auth | Clerk |
| Database | Supabase Postgres + pgvector |
| Storage | Supabase Storage |
| AI | OpenAI extraction, chat, embeddings, OCR-assisted flows |
| Billing | Stripe |
| Email | Resend |
| Jobs | Synchronous tracked execution today; Inngest is installed but not wired |
| Observability | Privacy-scrubbed Sentry hooks (enabled only when configured); PostHog dashboards are planned |
| Hosting | Vercel |

Status vocabulary used throughout the evidence package:

- **Implemented locally:** executable source path with deterministic local verification.
- **Recruiter demo/test:** synthetic fixtures or provider test-mode behavior; no real Stripe charge.
- **External verification required:** implemented path that still needs named recruiter-environment evidence.
- **Planned/deferred:** not wired or intentionally held for the future commercial release.

## Architecture overview

```text
User upload
  → Supabase Storage
  → parser/OCR pipeline
  → document text + page metadata
  → chunking + embeddings
  → pgvector retrieval
  → extraction templates / document chat
  → cited structured output
```

Key directories:

```text
src/app/                    Next.js routes and API handlers
src/app/(app)/              Authenticated dashboard, documents, chats, templates
src/components/             Upload, chat, extraction, template UI
src/lib/ai/                 Classification, chat, extraction, embeddings, template generation
src/lib/parsing/            PDF, DOCX, image/OCR, text parsing utilities
src/lib/auth/               Clerk workspace/user provisioning and usage helpers
src/lib/pipeline/           Document processing pipeline
src/lib/templates/          Template validation
supabase/migrations/        Database schema, RLS, RPCs, seed data
```

## Pricing model

Pricing source of truth lives in [`src/lib/plans.ts`](./src/lib/plans.ts). Paid checkout in the recruiter environment is Stripe test mode only; these tiers are product configuration, not evidence of customers or revenue.

| Plan | Price | Monthly pages | Seats | Notes |
| ---- | ----- | ------------- | ----- | ----- |
| Free | $0 | 25 | 1 | Built-in templates, community library, 1 AI template generation/month |
| Pro | $29/mo | 1,000 | 3 | Custom templates; external integrations are planned |
| Team | $99/mo | 10,000 | Unlimited | API-key management foundation; API, webhooks, and SSO are planned |
| Enterprise | Custom | Custom | Unlimited | Planned commercial/security options; contact for current scope |

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Visit <http://localhost:3000>.

Useful checks:

```bash
pnpm test:templates
pnpm test:extraction-eval
pnpm test:demo
pnpm test:security
pnpm test:lifecycle
pnpm test:lifecycle-db
pnpm test:readiness
pnpm test:parser-runtime
pnpm test:mcp
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## Security, QA, and release evidence

Paperline's release materials separate **Implemented**, **Demo/Simulated**, and **Planned** capabilities. The current evidence package includes:

- [Deployment and employment readiness tracker](./docs/readiness-tracker.md)
- [Repository-backed threat model](./docs/security/threat-model.md)
- [Application-security review](./docs/security/security-audit.md)
- [Risk-based QA strategy and test matrix](./docs/qa/test-strategy.md)
- [Production release and rollback checklist](./docs/release/production-readiness.md)
- [Recruiter-facing portfolio package](./docs/portfolio/README.md)

The recruiter demo is approved for evaluator viewing. It is **not an unrestricted commercial SaaS launch**; see the readiness tracker for the remaining authenticated depth, monitoring, backup, and rollback evidence.

## Database setup

1. Create/link an isolated Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
3. Apply migrations:

```bash
pnpm supabase link --project-ref <project-ref>
pnpm supabase db push
```

The migrations cover schema, RLS helpers/policies, built-in templates, vector search RPC, storage bucket bootstrap, service-role grants, expanded document types, AI-template pricing, community templates, machine credentials, rate limiting, and lifecycle/billing fencing. Do not apply migrations to a shared or recruiter database without the backup, identity, compatibility, and approval gates in the release checklist.

## Deployment topology and environment matrix

- **Recruiter/demo:** Vercel project `paperline`, recruiter URL `https://paperline-demo.olveraproductions.com`, established Vercel/Stripe callback host `https://paperline-xi.vercel.app`, isolated Clerk/Supabase/OpenAI resources, and Stripe test mode only. Required controls include `PAPERLINE_RECRUITER_DEMO=true`, `PAPERLINE_ALLOW_LIVE_STRIPE=false`, and `NEXT_PUBLIC_APP_URL=https://paperline-demo.olveraproductions.com`.
- **Git branches:** Git-triggered Vercel deployment is disabled project-wide. `release/**` is for hosted GitHub CI; recruiter deployments are created deliberately from an approved SHA through the staged CLI flow.
- **Future commercial:** `paperline.io` is reserved for a separate Vercel project and provider stack. It is not attached to the recruiter project and remains **ON HOLD / NO-GO**.
- **Local development:** `.env.local` only; it is ignored and must not influence CI-equivalent evidence.

See [`docs/vercel-deployment.md`](./docs/vercel-deployment.md) and the [active recruiter deployment goal](./docs/goals/complete-paperline-recruiter-portfolio-deployment.goal.md) for the staged no-alias deployment and approval sequence. Git remote: `https://github.com/HarrisonBlake01/paperline.git`.

## License

Proprietary. © Harrison Olvera. Paperline and Olvera Productions are product/business names he operates as an unregistered sole proprietor; they are not represented here as a separate corporation or LLC.
