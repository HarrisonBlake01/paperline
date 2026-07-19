# Paperline risk-based QA strategy

## Test objective

Prove the private, workspace-scoped SaaS path works and fails safely. The static Ops Agent route is a portfolio/demo artifact, not a substitute for the signed-in product test.

## Coverage layers

1. **Deterministic validation scripts** — templates, extraction scorer, demo fixture consistency, and security invariants.
2. **Build/static analysis** — ESLint, TypeScript through Next build, route generation, diff whitespace.
3. **HTTP contract checks** — public 200s, protected 307→`/sign-in`, health shape, no-store/security headers.
4. **Browser QA** — desktop and mobile layout, console/network review, auth rendering, legal/contact links.
5. **Accessibility** — Lighthouse/axe rules plus manual keyboard, focus, labels, headings, announcements, dialogs, and contrast.
6. **Production smoke test** — only after approved deployment; public alias, immutable URL, logs, headers, auth redirects, and synthetic signed-in journey.

## Traceable test matrix

| Risk / behavior | Automated evidence | Browser/manual evidence | Current status |
| --- | --- | --- | --- |
| Protected pages require auth | Proxy source invariant; local HTTP checks | `/dashboard` and `/documents` redirect to app `/sign-in` | Pass signed out |
| Workspace A cannot access B | RLS migration source assertions | Two-workspace negative matrix | Pending controlled account test |
| Upload type/size/content validation | `test:security` behavioral buffers | Invalid-file UI messaging | Automated pass; UI pending signed-in test |
| Folder belongs to active workspace | Source/security invariant | Cross-workspace folder UUID | Code pass; DB-backed negative test pending |
| Processing lifecycle tracked | `await processDocument` regression | Valid/malformed synthetic file states | Code pass; live path pending |
| Duplicate processing claim | Atomic queued/failed→processing invariant | Two concurrent retry requests produce one provider run | Code pass; DB-backed concurrency test pending |
| Expensive-operation rate limits | 0012/RPC/route security invariants | Exhaust each synthetic workspace limit; verify 429 and `Retry-After` | Code pass; migration-backed test pending |
| Extraction schema and scorer | `test:templates`, `test:extraction-eval` | Result/citation review | Automated pass; live path pending |
| Chat question bounds/citations | Zod/source review | Ask supported, unsupported, and injection-style questions | Pending signed-in test |
| Workflow doc cap/readiness | Zod/source review | Empty, mixed-status, partial-failure workflow | Pending signed-in test |
| API key admin/plan/revoke behavior | Route audit | Owner/member and revoked-key cases | Pending signed-in test |
| Stripe safety | `test:security` key-mode cases; webhook source review | Test-mode checkout/portal; invalid config | Code pass; dashboard test pending |
| Clerk/Stripe forged webhook | Signature construction source review | Safe synthetic webhook harness | Pending integration harness |
| Stable API errors | source scan; build | network response inspection | Partial pass; signed-in paths pending |
| Public routes | local HTTP loop | Desktop/mobile visual review | Pass: `/`, `/ops-agent`, legal, status, changelog, contact |
| Accessibility | Lighthouse | Keyboard/focus/manual review | Public routes automated pass; signed-in manual pending |
| Responsive layout | Lighthouse mobile emulation/screenshots | 390px + desktop review | Public landing/Ops pass |

## Required synthetic signed-in release script

Use a dedicated test workspace and non-sensitive generated files only.

1. Sign up/sign in with production-like Clerk keys.
2. Verify empty dashboard and workspace creation.
3. Upload a valid text file, PDF, DOCX, JPEG/PNG scan.
4. Reject: empty file, mismatched MIME/signature, oversized file, malformed PDF, generic ZIP as DOCX, bad folder UUID.
5. Confirm queued/processing/ready/failed states and retry behavior.
6. Run built-in and custom extraction; inspect normalized values and citations.
7. Ask a supported question, unsupported question, and prompt-injection-style question; confirm no secret/action boundary crossing.
8. Create chat/workflow with valid docs; reject foreign/not-ready/duplicate IDs.
9. Test owner/admin/member authorization for API keys and billing.
10. Run Stripe test-mode checkout/portal and signed webhook fixtures; no real charges.
11. Repeat core routes using a second workspace and guessed IDs; expect 404/403 and no content leakage.
12. Inspect console, network failures, server logs, and audit events.

## Accessibility results

Baseline local Lighthouse:

- Landing: **0.92**, contrast and inline-link findings.
- Sign-in: **0.98**, missing main landmark.
- Ops Agent: **0.96**, one low-contrast solid status.

After remediation:

- Landing: **1.00**.
- Sign-in: **1.00** after adding the `<main>` landmark and contrast-safe Clerk primary color.
- Ops Agent: **1.00**.
- Full mobile Lighthouse runs for landing and Ops Agent reported accessibility **1.00** and produced responsive screenshots without visible clipping.

These scores cover audited public routes only and do not constitute WCAG or Section 508 certification.

## Release gate commands

```bash
pnpm test:templates
pnpm test:extraction-eval
pnpm test:demo
pnpm test:security
pnpm lint
pnpm build
pnpm audit --prod --audit-level=high
git diff --check
```

Every command must run individually with an explicit exit status in the final release pass.
