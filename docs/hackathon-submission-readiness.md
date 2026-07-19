# Paperline Ops Agent — Hackathon Submission Readiness

Live demo route:

- <https://paperline-xi.vercel.app/ops-agent>

Primary script:

- `docs/ops-agent-demo-script.md`

Goal prompt / continuation anchor:

- `docs/goals/complete-paperline-hackathon.goal.md`

## Demo story

Paperline Ops Agent is a focused hackathon demo showing how Paperline turns business documents into verified operations:

1. A small business uploads an invoice + contract bundle.
2. Paperline extracts key fields with confidence scores, page-level citations, and quoted source evidence.
3. Hermes Agent turns cited facts into an operations plan: invoice approval, renewal reminder, and vendor follow-up draft.
4. Stripe appears as a test-mode business operation: usage billing/provisioning preview for processed pages.
5. Spend and external actions are paused behind human approval.
6. NVIDIA NemoClaw/OpenShell is framed as the enterprise secure-runtime path for sandboxing, credential brokering, network policy, and auditability.

## Hackathon requirement mapping

- **Usefulness:** Document-heavy teams get approval-ready operational work instead of raw summaries.
- **Viability:** Paperline can charge by workspace/page usage and expand into invoice, contract, and admin workflows.
- **Presentation:** The `/ops-agent` route tells the workflow in one visible sequence: job → cited facts → recommended actions → Stripe test mode → Hermes trace → NVIDIA security path.
- **Agents that earn/spend/run operations:** Hermes prepares operational follow-up and a Stripe test-mode usage/billing step, while spend/provisioning remains approval-gated.

## Guardrails for recording/submission

- Stripe must be described as **test mode** unless Kurai explicitly approves real transactions.
- Do not claim real payment execution, purchases, HIPAA, SOC 2, or legal compliance.
- Do not expose secrets, private documents, tokens, environment variables, or live customer data.
- Do not post the tweet, submit Typeform, or drop links in Discord without explicit approval.

## Manual submission steps remaining

1. Record a 1–3 minute video using `docs/ops-agent-demo-script.md`.
2. Upload the video somewhere suitable for the tweet.
3. Tweet the demo tagging `@NousResearch`.
4. Drop the tweet link in the hackathon submissions Discord channel.
5. Fill out the Typeform submission.

## Verification checklist for final deploy

Final deployment verified against production alias: <https://paperline-xi.vercel.app/ops-agent>

- [x] `pnpm test:demo` passes.
- [x] `pnpm lint` passes.
- [x] `pnpm build` passes.
- [x] `vercel --prod --yes` succeeds.
- [x] <https://paperline-xi.vercel.app/ops-agent> returns HTTP 200.
- [x] Live route loads in browser.
- [x] Browser console has no JavaScript errors.

Notes:

- Vercel deployment URL from latest final build: `https://paperline-flut5xqv3-harrisonolvera23-7297s-projects.vercel.app`
- Production alias: `https://paperline-xi.vercel.app`
- Latest deployment also verified `/`, `/terms`, `/privacy`, `/status`, `/changelog`, and `/ops-agent` return HTTP 200.
- Browser console showed no JavaScript errors on the landing page or Terms page.
