# Paperline Ops Agent — Hackathon Demo Script

Purpose: 1–3 minute submission video for the Hermes Agent Accelerated Business Hackathon by Nous Research, NVIDIA, and Stripe.

Demo URL/path:

- Local route: `/ops-agent`
- Public Paperline URL to reference: <https://paperline-xi.vercel.app/>

## Target length

Aim for **2:10–2:40**. Do not rush past the citations and approval boundary; those are the strongest differentiators.

## Spoken script

### 0:00–0:15 — Problem

Every small business has document work: invoices, contracts, vendor forms, and reports. The hard part is not just reading them — it is turning them into verified actions.

### 0:15–0:35 — Introduce Paperline

This is Paperline Ops Agent. Paperline turns business documents into cited answers, structured fields, and approval-ready workflows. The goal is not generic PDF chat — it is a document back office that can help run operations safely.

### 0:35–1:05 — Show the document job

Here, Northstar Supply Co. has an operations job with a master services agreement and a vendor invoice. Paperline groups the documents, extracts the key business fields, and keeps the result tied to the source document.

### 1:05–1:35 — Show cited extraction

The agent extracts the invoice total, payment due date, contract term, and an auto-renewal clause that needs human review. Each result includes confidence, page-level citations, and quoted source text, so the team can verify the recommendation before acting.

### 1:35–2:00 — Show agent actions

Hermes Agent turns those verified fields into operational follow-up: approve the invoice, create a renewal reminder, and draft a vendor clarification email. These are not hidden black-box decisions — they are visible action items with owners and states.

### 2:00–2:20 — Show Stripe and approval boundary

For the business-operation angle, Paperline shows a Stripe test-mode usage preview for processed pages. The important boundary is that the agent can prepare billing or provisioning steps, but external spend stays paused until a human approves.

### 2:20–2:40 — Show NVIDIA/NemoClaw security path and close

For private business documents, runtime safety matters. The enterprise path uses NVIDIA NemoClaw and OpenShell for sandboxing, credential brokering, network policy, and auditable traces. Paperline is an AI back office for document-heavy teams: it reads, cites, decides what needs action, and runs the workflow safely.

## Screen recording shot list

1. Open `/ops-agent` and pause on the hero.
2. Hover or visually emphasize the three badges:
   - Hermes Agent operator
   - Stripe test-mode operation
   - NemoClaw/OpenShell secure path
3. Show the Northstar operations job card.
4. Scroll to the metrics row.
5. Show the cited extraction cards; pause on invoice total and contract term.
6. Show recommended actions and approval states.
7. Show Stripe test-mode business operation and the waiting-for-approval warning.
8. Show Hermes operator trace.
9. Show NVIDIA secure runtime path.
10. End on “From uploaded documents to paid, cited business actions.”

## Submission tweet draft

Built Paperline Ops Agent for the Hermes Agent Accelerated Business Hackathon by @NousResearch, NVIDIA, and Stripe.

Paperline turns invoices and contracts into cited answers, structured fields, approval workflows, and safe agent-run operations.

Hermes Agent runs the document back office: extraction review, approval checklists, renewal reminders, and Stripe test-mode billing/provisioning steps that stay behind human approval.

The enterprise path uses NVIDIA NemoClaw/OpenShell for sandboxed execution, credential isolation, network policy, and auditable agent traces.

Demo: [video link]

## Manual review checklist before posting

- [ ] Confirm the deployed route is live if using production, not just local.
- [ ] Keep Stripe references clearly in test mode unless real approval is given.
- [ ] Do not claim HIPAA, SOC 2, legal compliance, or real payment execution.
- [ ] Tag `@NousResearch` in the final tweet.
- [ ] Drop the tweet link in the hackathon submissions channel.
- [ ] Fill out the Typeform submission.
