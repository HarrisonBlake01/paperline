# Paperline interview talking points

## Recruiter-screen answer (30 seconds)

> Paperline is a full-stack AI document-intelligence SaaS I built to turn PDFs, DOCX files, scans, and images into structured, reviewable information. It combines document parsing and OCR fallback, schema-guided extraction, cited retrieval chat, Clerk workspaces, Supabase/Postgres with pgvector, persisted workflows, and Stripe billing. The flagship Ops Agent demo shows how verified invoice and contract facts can become approval-ready actions while external spend and changes remain paused for a human.

## Technical answer (60 seconds)

> A signed-in user uploads a document into private Supabase storage through an authenticated Next.js route. The server resolves workspace membership, creates a workspace-scoped document record, parses PDF, DOCX, or text content, and falls back to OCR for scans and images. It preserves page metadata, chunks the text, generates embeddings, and stores those chunks for semantic retrieval. Extraction applies runtime-validated reusable schemas; chat retrieves document-scoped chunks and returns answers with page and snippet citations. Billing routes create Stripe Checkout or Portal sessions, and signature-verified webhooks synchronize subscription state. I also built a synthetic offline evaluation harness so extraction changes can be scored rather than reviewed only through screenshots.

## Strong engineering decisions

### 1. Evidence before automation

- Preserve page metadata during parsing and chunking.
- Return citations and quoted source snippets with model output.
- Show confidence and uncertainty before recommended actions.
- Keep the source evidence visible in the same review flow.

**Why:** Document workflows are higher trust when users can inspect the evidence instead of accepting an ungrounded summary.

### 2. Deterministic controls around probabilistic output

- Validate template/extraction shapes at runtime.
- Keep authentication, workspace authorization, billing, usage limits, persistence, and approval rules in deterministic application code.
- Treat the model as a bounded component for classification, extraction, OCR-assisted flows, and grounded answers.

**Why:** The model should not decide who can see data, spend money, or cross tenant boundaries.

### 3. Human approval for consequential actions

- The demo prepares invoice approval, renewal reminders, and clarification drafts.
- External actions and spend remain visibly paused.
- Action ownership and state are exposed instead of hidden in an opaque agent loop.

**Why:** Useful agents should reduce preparation work without silently taking irreversible action.

### 4. Honest demo boundaries

- Synthetic invoice and contract fixtures drive the Ops Agent route.
- Stripe is explicitly test mode; the $6 amount is a preview, not a real charge.
- Hermes execution, durable approval orchestration, and NemoClaw/OpenShell isolation are productionization directions.
- No customer, revenue, latency, HIPAA, SOC 2, or production-model accuracy claim is made.

### 5. Evidence-driven security and QA

- Patched a confirmed High Next.js advisory and reduced the production audit from 12 High findings to zero High/Critical findings.
- Added content-signature upload validation, workspace-scoped folder validation, cross-tenant RLS relationship checks, safe provider errors, Stripe customer binding, and regression checks.
- Used Lighthouse and browser/HTTP checks to find and fix contrast, landmark, redirect, and response-header issues.
- Deployed production Clerk authentication and a least-privilege signature-verified user-provisioning webhook; retained explicit follow-ups for enforced CSP, monitoring/backup/rollback evidence, and a refreshed signed-in two-workspace matrix.

**Why:** Security and QA are credible only when findings, fixes, tests, and unresolved blockers are all visible.

## Evaluation story

The small extraction harness contains three synthetic document types and 20 labeled fields. The deliberately imperfect bundled predictions produce:

- 40.00% exact field accuracy
- 75.00% type-aware normalized field accuracy
- 94.12% presence F1
- 85.71% list-item F1

**What this demonstrates:** exact string matching can understate useful extraction quality when dates, currency, casing, whitespace, booleans, and list ordering differ. The harness reports both exact and type-aware metrics while keeping null/presence behavior visible.

**What it does not demonstrate:** live-model accuracy, confidence calibration, customer-document performance, or statistically meaningful production quality. The next step is to capture live predictions against a larger, versioned, privacy-safe benchmark.

## Tradeoffs and likely follow-ups

### Why use synchronous workflow execution today?

It kept the first end-to-end product path small and inspectable. The route persists workflow/item state, but serial execution inside one request is vulnerable to timeouts and lacks durable retry/resume semantics. I would move it to Inngest with idempotency keys, step-level retries, resumable state, and dead-letter handling.

### Where is tenant isolation enforced?

Clerk establishes identity; server routes resolve workspace membership and role; database migrations add workspace-scoped RLS policies. Privileged service-role access remains server-only, but because it bypasses RLS, every privileged query still needs explicit workspace filters and ownership checks. I added a hardening migration that validates both sides of tenant relationships and verified a synthetic two-workspace candidate matrix. A refreshed production-Clerk matrix remains follow-up evidence rather than a claim of unrestricted commercial readiness.

### How would you productionize approvals?

Persist policy, actor, proposed action, evidence, state transition, expiration, and execution result. Use an explicit state machine such as proposed → awaiting approval → approved/rejected → executing → completed/failed, with idempotent execution and an audit event for every transition.

### How would you improve observability?

Add trace IDs across upload, parsing, OCR, embeddings, extraction, retrieval, workflow, and billing operations. Record latency, token/cost estimates, low-confidence rates, retry counts, and failures. Wire Sentry/PostHog dashboards only after defining which events are useful and safe to collect without leaking document content.

### How would you evaluate retrieval and citations?

Build labeled question/document pairs, score answer correctness separately from citation coverage, verify that cited snippets support each claim, and add adversarial cases for missing evidence, conflicting pages, prompt injection, and cross-document contamination.

## STAR-style stories

### Trustworthy extraction

- **Situation:** AI document tools can produce plausible answers without enough evidence to verify them.
- **Task:** Make extracted fields and answers useful for operational review.
- **Action:** Preserved page metadata, added cited retrieval, showed quoted evidence and confidence, and created reusable validated schemas.
- **Result:** The product can present structured outputs and grounded answers in a reviewable flow; the claim is product behavior, not measured customer impact.

### Turning a demo into an evaluable system

- **Situation:** Screenshots alone could not show whether extraction changes improved or regressed behavior.
- **Task:** Add a small repeatable quality check without using private documents or paid model calls.
- **Action:** Created three synthetic cases, 20 labels, imperfect sample predictions, and a deterministic TypeScript scorer for exact, normalized, presence, and list metrics.
- **Result:** Prompt/model changes now have an offline regression contract that can expand into a real benchmark.

### Approval-safe agent design

- **Situation:** The hackathon story needed to connect document understanding with operations and billing without implying uncontrolled actions.
- **Task:** Demonstrate agentic value while preserving human control and truthful claims.
- **Action:** Built one reviewer-friendly Ops Agent surface with citations, recommended actions, visible ownership/state, Stripe test-mode preview, operator trace, and explicit planned-integration labels.
- **Result:** The 2:16 walkthrough communicates the complete workflow while clearly separating implemented product paths, synthetic demo fixtures, and future production hardening.

## Questions to ask the interviewer

- How does your team evaluate agent output beyond task completion—especially evidence quality, failure recovery, and human override?
- Which actions are safe for agents to execute autonomously, and which require approval?
- How do you test tenant and permission boundaries when models can call tools?
- What observability is most useful for debugging production agent workflows?
- How are prompt/model changes versioned and evaluated before rollout?

## Avoid overclaiming

Do not say:

- “The Ops Agent autonomously pays invoices.”
- “Paperline is HIPAA or SOC 2 compliant.”
- “NemoClaw/OpenShell is deployed in production.”
- “The evaluation proves 75% production accuracy.”
- “Sentry/PostHog and Inngest are fully wired.”

Prefer:

- “The demo prepares approval-ready actions and keeps spend paused.”
- “The architecture is designed for sensitive documents without claiming certification.”
- “NemoClaw/OpenShell is the documented secure-runtime direction.”
- “The offline sample baseline validates the scorer and exposes normalization effects.”
- “The repository includes dependencies and a concrete productionization plan for durability and observability.”
