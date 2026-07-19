# Paperline root README recommendation

The root `README.md` already explains the product, stack, capabilities, architecture, setup, pricing, and security posture. A wholesale rewrite would add risk while the Ops Agent work is still uncommitted. The recommended change is a small recruiter-facing section plus two accuracy edits.

## Recommended insertion

Place this block after **Why this project matters**:

```markdown
## Flagship portfolio demo

Paperline's Ops Agent demo compresses the product story into one reviewable workflow: synthetic invoice and contract inputs → cited structured fields → human-owned recommended actions → Stripe test-mode usage preview → operator trace → secure-runtime direction.

- [Recruiter-ready case study](./docs/portfolio/case-study.md)
- [Mermaid architecture and trust boundaries](./docs/portfolio/architecture.md)
- [Interview talking points](./docs/portfolio/interview-talking-points.md)
- [Portfolio media and claims guide](./docs/portfolio/README.md)
- [Offline extraction evaluation](./evals/document-extraction/README.md)

The Ops Agent route uses synthetic fixtures. It does not execute a real payment, provisioning change, or external action. Live Hermes execution, durable job orchestration, fully wired observability, persisted approval state machines, and NemoClaw/OpenShell isolation are documented productionization directions rather than completed integrations.
```

## Recommended checks block

Replace the current Useful checks block with:

```bash
pnpm test:templates
pnpm test:extraction-eval
pnpm test:demo
pnpm lint
pnpm build
```

## Recommended stack wording corrections

Current wording can be read as stronger than the repository evidence supports:

```text
Jobs | Inngest planned/installed for background workflow expansion
Observability | Sentry + PostHog planned/installed
```

Recommended wording:

```text
Jobs | Current workflows execute synchronously; Inngest is installed as the planned durable orchestration path
Observability | Sentry and PostHog dependencies are installed; production event design, dashboards, and alerting remain to be wired
```

## Claims to keep out of the root README

Do not add customer adoption, revenue, time-saved, model-accuracy, latency, compliance, production-autonomy, or real-payment claims until each has direct evidence. Keep the existing statement that Paperline does not claim formal HIPAA, SOC 2, or legal compliance certification.

## Recommendation status

This file is a recommendation only. The root `README.md` was not changed by the flagship packaging pass, preserving the user's existing uncommitted work and keeping recruiter artifacts isolated under `docs/portfolio/`.
