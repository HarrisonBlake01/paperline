# Paperline

**Paperline turns documents into structured, verifiable answers.**

It is an AI document intelligence SaaS built as an Olvera Productions product. Users upload PDFs, DOCX files, scans, reports, contracts, invoices, and other business documents; Paperline parses/OCRs them, extracts structured fields with reusable templates, and lets users chat with the source material using citations.

## Why this project matters

Paperline is designed around a practical AI-engineering problem: making LLM output useful in workflows where users need **receipts**, not just summaries. The app combines document parsing, OCR fallback, embeddings, retrieval, schema-guided extraction, billing, auth, and multi-tenant data boundaries into a production-style SaaS foundation.

For recruiters and technical reviewers, the core signal is end-to-end product engineering:

- AI extraction with validated, reusable schemas
- Retrieval-augmented document chat with page-level citations
- Multi-tenant workspace model with Clerk auth and Supabase RLS-aware data design
- Supabase Postgres + pgvector storage for document chunks and semantic search
- Stripe billing for Free / Pro / Team plans
- Community template publishing, voting, copying, and starter seeded examples
- Production-minded Next.js 16 App Router implementation with TypeScript and Tailwind v4

## Current product capabilities

### Demo workflow

The mentor demo path is intentionally simple: sign in, upload an important document, wait for Paperline to process it, review the extracted text/details, run an extraction template, then save the same kind of review as a repeatable workflow. The app is tuned for general users first, so the interface should explain what happened and what to do next without exposing model/provider internals.

### Security and privacy posture

**Designed for sensitive documents.** Paperline treats uploaded files as private workspace data and avoids public-by-default access patterns. Server routes should enforce Clerk authentication, workspace ownership checks, and private Supabase access for documents, extractions, workflows, templates, and API keys.

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
| Jobs | Inngest planned/installed for background workflow expansion |
| Observability | Sentry + PostHog planned/installed |
| Hosting | Vercel |

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

Pricing source of truth lives in [`src/lib/plans.ts`](./src/lib/plans.ts).

| Plan | Price | Monthly pages | Seats | Notes |
| ---- | ----- | ------------- | ----- | ----- |
| Free | $0 | 25 | 1 | Built-in templates, community library, 1 AI template generation/month |
| Pro | $29/mo | 1,000 | 3 | Custom templates; external integrations are planned |
| Team | $99/mo | 10,000 | Unlimited | API-key management foundation; API, webhooks, and SSO are planned |
| Enterprise | Custom | Custom | Unlimited | Planned commercial/security options; contact for current scope |

## Local development

```bash
pnpm install
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

The current working tree is suitable for controlled recruiter/demo review after local gates pass. It is **not yet approved for unrestricted public SaaS launch**; see the readiness tracker for production blockers and claims boundaries.

## Database setup

1. Create/link a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
3. Apply migrations:

```bash
pnpm supabase link --project-ref <project-ref>
pnpm supabase db push
```

The migrations cover schema, RLS helpers/policies, built-in templates, vector search RPC, storage bucket bootstrap, service-role grants, expanded document types, AI-template pricing, community templates, and starter community seed data.

## Deployment notes

- Vercel project: `paperline`
- Custom domain: `paperline.io`
- Supabase project currently linked locally
- Clerk, Stripe, Resend, OpenAI, Sentry, and PostHog are configured through environment variables
- Git remote is configured as `https://github.com/HarrisonBlake01/paperline.git`

## License

Proprietary. © Olvera Productions.
