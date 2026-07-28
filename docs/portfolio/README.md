# Paperline flagship portfolio pack

Paperline is a full-stack AI document-intelligence SaaS that turns uploaded business documents into structured, cited, reviewable outputs while keeping consequential actions behind explicit human approval.

Recruiter deployment target: `https://paperline-xi.vercel.app`. The current public alias is prior-demo evidence until the exact reviewed commit passes hosted CI and recruiter runtime acceptance. Stripe is test mode only; `paperline.io` is reserved for a separate future commercial release and remains frozen.

## Start here

1. [Case study](./case-study.md) — problem, implementation, decisions, evaluation, limits, and next steps.
2. [Architecture](./architecture.md) — Mermaid system diagram, trust boundaries, data flow, and repository evidence.
3. [Interview talking points](./interview-talking-points.md) — recruiter answer, technical deep dives, tradeoffs, and honest boundary language.
4. [README recommendation](./readme-recommendations.md) — small, ready-to-paste root README improvement.
5. [Presentation claims audit](./presentation-claims-audit.md) — verified boundary between live page, repository code, synthetic fixtures, and planned integrations.
6. [Fable 5 PowerPoint prompt](./fable-5-powerpoint-prompt.md) — full recruiter-deck production brief, slide plan, asset list, and verification requirements.
7. [Screenshot checklist](./screenshot-checklist.md) — approved internal captures, alt text, and public-sharing checks.
8. [Walkthrough production notes](./walkthrough-production-notes.md) — media specs, story order, and claims guardrails.
9. [Threat model](../security/threat-model.md) — assets, trust boundaries, abuse cases, and controls.
10. [Security review](../security/security-audit.md) — confirmed findings, remediations, residual risk, and evidence.
11. [QA strategy](../qa/test-strategy.md) — risk-based matrix, browser/accessibility evidence, and signed-in release script.
12. [Production readiness](../release/production-readiness.md) — go/no-go, environment model, deploy verification, and rollback.

## Reviewable media

- **Narrated walkthrough:** [`paperline-ops-agent-walkthrough.mp4`](./paperline-ops-agent-walkthrough.mp4) — 136.17 seconds, 1920×1080, H.264/AAC.
- **Hero:** [`screenshots/01-ops-agent-hero.png`](./screenshots/01-ops-agent-hero.png)
- **Cited extraction and approvals:** [`screenshots/02-cited-extraction-approvals.png`](./screenshots/02-cited-extraction-approvals.png)
- **Billing, trace, and security direction:** [`screenshots/03-billing-trace-security.png`](./screenshots/03-billing-trace-security.png)

All three recruiter-ready screenshots are 1440×810. The Ops Agent route and media use synthetic fixtures; they contain no customer documents.

## Evaluation snapshot

Run:

```bash
pnpm test:extraction-eval
```

Bundled sample-prediction baseline:

- 3 synthetic cases
- 20 labeled fields
- 40.00% exact field accuracy
- 75.00% normalized field accuracy
- 94.12% presence F1
- 85.71% list-item F1

These numbers validate the deterministic scorer against deliberately imperfect sample predictions. They are not claims about live-model or production accuracy.

## Repository gates

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

## Claims boundary

Implemented product paths include bounded document processing, extraction, cited retrieval chat, workspace/auth boundaries, persisted workflow records, Stripe billing routes, upload signature checks, security headers, and security regression checks. The Ops Agent action plan, approval states, and $6 test-mode preview are synthetic demo fixtures. Live Hermes execution, durable Inngest orchestration, fully wired Sentry/PostHog observability, persisted approval state machines, external API/webhook product surfaces, and NVIDIA NemoClaw/OpenShell isolation are explicit productionization directions—not claimed as completed integrations.
