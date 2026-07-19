# Paperline Ops Agent — Hermes Accelerated Business Hackathon Plan

Created: 2026-06-16  
Project path: `/Users/openclaw-server/.openclaw/workspace/paperline/app`  
Live demo URL to use for public references: <https://paperline-xi.vercel.app/>  
Hackathon: Hermes Agent Accelerated Business Hackathon by Nous Research, NVIDIA, and Stripe  
Deadline: EOD Tuesday, June 30, 2026

## One-line concept

**Paperline Ops Agent turns uploaded business documents into cited answers, structured fields, approval workflows, billing/provisioning steps, and safe agent-run operations.**

## Recommended hackathon positioning

Paperline should not be positioned as generic PDF chat. The stronger angle is:

> Paperline is an AI back office for document-heavy teams. It reads documents, cites sources, decides what needs action, and runs the workflow safely.

This fits the hackathon because the prompt asks for agents that can **earn, spend, and run real operations at scale**.

## Core demo scenario

A small business uploads a document bundle:

- `Contract.pdf`
- `Invoice.pdf`
- Optional: `Vendor agreement.pdf` or `Renewal notice.pdf`

Paperline Ops Agent then:

1. Creates or selects a customer/workspace context.
2. Processes the uploaded documents.
3. Extracts structured fields with confidence and page-level citations.
4. Identifies operational actions:
   - invoice approval needed
   - payment due date
   - contract renewal reminder
   - risky clause requiring human review
   - missing or ambiguous field needing follow-up
5. Drafts the human-facing follow-up:
   - approval checklist
   - vendor clarification email
   - renewal reminder text
   - internal task summary
6. Demonstrates a Stripe-backed business operation in test mode:
   - usage-based page billing preview, or
   - Checkout/Portal for Pro/Team plan, or
   - agent approval before paid/provisioned action.
7. Frames the enterprise deployment path with NVIDIA NemoClaw/OpenShell:
   - sandboxed Hermes runtime
   - credential isolation
   - network policy controls
   - auditable traces for sensitive document workflows.

## MVP feature slice

Build one polished workflow only:

> Upload invoice + contract bundle → cited extraction → operations action plan → Stripe test billing/provisioning/approval step → 1–3 minute video demo.

### Must show

- Document upload or selected demo bundle.
- Extracted fields from at least invoice + contract examples.
- Page-level citations / quoted source snippets.
- Recommended actions generated from the extracted fields.
- Human approval boundary before external/spend action.
- Stripe test-mode business operation.
- Clear mention of Hermes Agent as the operator.
- Clear mention of NVIDIA NemoClaw/OpenShell as the secure runtime path.

### Nice-to-have

- A dedicated `/ops-agent` or dashboard panel showing:
  - document job status
  - extracted fields
  - citations
  - agent action log
  - approval required / approved / completed states
- Job JSON handoff between app and Hermes:
  - app writes/serves job payload
  - Hermes creates operations plan
  - app displays plan
- A reusable Hermes skill/memory story:
  - “The agent learns how this workspace wants invoice/contract reviews formatted.”

## Suggested product copy

### Short pitch

Paperline turns business documents into verified operations. Upload invoices, contracts, and reports; get structured fields, cited answers, approval checklists, and safe agent-run follow-up.

### Demo tagline

From uploaded documents to paid, cited business actions.

### Landing/demo language

- “Read documents with receipts.”
- “Turn PDFs into approval-ready workflows.”
- “Every answer links back to the source page.”
- “Agent actions stay behind human approval before spend or external changes.”
- “Built for sensitive document operations, with a secure NemoClaw/OpenShell deployment path.”

## Demo script outline

### 0:00–0:15 — Problem

Every small business has document work: invoices, contracts, vendor forms, and reports. The hard part is not just reading them — it is turning them into verified actions.

### 0:15–0:35 — Paperline

Paperline turns documents into cited answers, structured data, and operational workflows. Every result links back to the source page so teams can verify before acting.

### 0:35–1:15 — Upload and extraction

Show the invoice/contract bundle. Paperline extracts invoice total, payment due date, contract renewal term, parties, governing law, and the clause that needs review.

### 1:15–1:45 — Hermes operations agent

Hermes Agent turns verified output into operations: approval checklist, renewal reminder, draft email, action log, and safe tool calls.

### 1:45–2:10 — Stripe

Show Stripe test-mode checkout, billing preview, usage event, or approval-before-spend flow. Position it as how the agent can help Paperline earn/provision/spend with controls.

### 2:10–2:35 — NVIDIA/NemoClaw

For private business documents, safety matters. The enterprise path uses NVIDIA NemoClaw/OpenShell for sandboxed execution, credential isolation, network policy, and auditable traces.

### 2:35–3:00 — Close

Paperline is an AI back office for document-heavy teams: it reads, cites, decides what needs action, and runs the workflow safely.

## Build phases

### Phase 1 — Hackathon slice definition

- Choose final demo documents.
- Define expected extraction fields.
- Define operations action plan JSON/Markdown schema.
- Choose the Stripe test-mode moment.

### Phase 2 — UI/demo surface

- Add an ops-agent dashboard section or dedicated demo route.
- Show document bundle, citations, action plan, approval state, and action log.
- Keep UI general-user friendly; avoid raw model/token/provider language.

### Phase 3 — Hermes handoff

- Add a job payload format under docs or app API.
- Let Hermes produce the operations plan from extracted document output.
- Save the result back as a file/API response/action record for demo display.

### Phase 4 — Stripe test-mode operation

Recommended simplest version:

- Use existing Stripe billing foundation.
- Demo Checkout/Portal or usage billing preview in test mode.
- Clearly label it as test mode.
- Show human approval before spend/provisioning.

### Phase 5 — NVIDIA secure-runtime story

- Attempt NemoClaw/OpenShell setup if time allows.
- If full integration is too slow, document the architecture path and show the local Hermes workflow as the working demo.
- Do not block the submission on full NemoClaw deployment.

### Phase 6 — Submission assets

- Record 1–3 minute demo video.
- Tweet with short writeup tagging `@NousResearch`.
- Drop tweet link in submissions channel.
- Fill Typeform.

## First implementation tasks

1. Inspect current app routes/components around dashboard, documents, workflows, billing, and templates.
2. Decide whether the hackathon UI should be:
   - a real dashboard extension, or
   - a dedicated demo route that reuses production components.
3. Create a sample `ops-agent-job.json` and `ops-agent-result.json` format.
4. Build the visible action-plan panel.
5. Wire or simulate only non-security-critical demo data honestly; do not fake auth, privacy, billing, or spend claims.
6. Run `pnpm test:demo`, `pnpm lint`, and `pnpm build` before demo recording.

## Guardrails

- Do not spend money or perform real purchases without explicit approval.
- Use Stripe test mode for the hackathon demo unless Kurai explicitly approves real transactions.
- Do not claim HIPAA/SOC 2/legal compliance.
- Do not expose secrets or document content in logs.
- Keep Paperline’s existing general-user positioning: polished, calm, privacy-conscious, and business-friendly.
