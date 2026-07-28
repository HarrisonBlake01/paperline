/goal Complete and publish Paperline’s recruiter-facing portfolio deployment at `https://paperline-xi.vercel.app`, prepare GitHub for intentional recruiter review, and keep the separate commercial `paperline.io` launch frozen until Harrison explicitly resumes it.

## Repository and deployment identities

- Repository: `/Users/openclaw-server/.openclaw/workspace/paperline/app`
- GitHub: `https://github.com/HarrisonBlake01/paperline`
- Recruiter site: `https://paperline-xi.vercel.app`
- Recruiter Vercel project: `harrisonolvera23-7297s-projects/paperline` (`prj_OfKl0NNnacxQ5pTX3X0QNhNkbrMc`)
- Future commercial site: `https://paperline.io`

Vercel calls the stable target of the current `paperline` project “Production.” Within Paperline’s product lifecycle, that project and `paperline-xi.vercel.app` are the **recruiter/demo environment**. The future commercial site must use a separate Vercel project and separate provider stack. Never attach `paperline.io` or `www.paperline.io` to the recruiter project.

## Active outcome

Ship a polished, stable, defensible recruiter portfolio that demonstrates Paperline’s applied-AI document workflows, cited answers, extraction, tenant boundaries, billing UX, security engineering, QA, CI, and release discipline without initiating a commercial SaaS launch.

A recruiter should be able to:

1. Understand the product and Harrison’s contribution in under 60 seconds.
2. Use a safe synthetic-data workflow without seeing private data.
3. Exercise authenticated document, extraction, citation/chat, workflow, deletion, and Stripe test-mode UX where enabled.
4. Review an intentional GitHub candidate with truthful claims and green hosted CI.
5. See evidence of threat modeling, tenant isolation, secure lifecycle handling, regression testing, deployment verification, and known limitations.

## Commercial-launch hold

Commercial launch is **ON HOLD / NO-GO**. Do not perform or prepare an implicit commercial cutover.

Deferred until Harrison explicitly resumes the commercial track:

- creation/configuration of the future commercial Vercel project
- attachment or DNS routing of `paperline.io` or `www.paperline.io`
- live Stripe keys, live Prices, real Customers, real subscriptions, or real payment methods
- production Clerk/Supabase/Stripe migrations or provider cutover for commercial customers
- production migration/legacy-data work that is not required for an isolated recruiter database
- paid-launch decisions, public sales claims, customer onboarding, outreach, or transactions

Preserve commercial-ready code and migration work. Do not delete or weaken it merely because the commercial release is paused.

## Acting role and evidence standard

Act as Paperline’s senior full-stack engineer, application-security reviewer, QA lead, release engineer, and technical portfolio editor.

Do not stop at a plan. Inspect real source and provider state, implement bounded fixes, run tests, exercise the deployment, and record evidence. Runtime evidence outranks assumptions or model consensus. Never fabricate a pass when credentials, dashboard access, or an approved external action is unavailable.

Maintain explicit labels:

- **Implemented:** executable path verified in source and the relevant runtime.
- **Demo/Test:** synthetic or provider-test-mode behavior.
- **Planned/Deferred:** not connected or not verified end to end.

Never claim customers, revenue, production accuracy, uptime, compliance certification, formal penetration testing, WCAG conformance, or live integrations without evidence supporting that exact claim.

## Sources of truth

Read and keep synchronized:

- `docs/release/checklists/2026-07-27-pre-deployment-test-matrix.md`
- `docs/release/checklists/2026-07-27-github-production-prep.md`
- `docs/release/production-readiness.md`
- `docs/readiness-tracker.md`
- `docs/security/security-audit.md`
- `docs/security/threat-model.md`
- `docs/qa/test-strategy.md`
- `docs/portfolio/presentation-claims-audit.md`
- `SECURITY.md`

The dated checklists contain evidence, not permission. Re-verify material facts before acting.

## Phase 1 — bind and clean the recruiter candidate

1. Preserve the current dirty working tree and classify every changed/untracked file as recruiter candidate, private/local-only artifact, unrelated work, or deferred commercial work.
2. Keep private recruiter MP4, MP3, PDF, deck, QA frames, private previews, credentials, and local runtime state excluded from Git and Vercel unless Harrison explicitly selects sanitized assets for publication.
3. Re-run exact-candidate secret scanning over tracked plus untracked non-ignored files; scan Git history separately.
4. Review the full candidate diff, migration order, dependency changes, and generated artifacts.
5. Reconcile Node/pnpm/package-manager pins and Vercel runtime settings.
6. Produce an immutable candidate manifest excluding only documented self-referential ledgers.
7. Obtain explicit approval before staging or committing. Record the reviewed commit and tree after approval.

## Phase 2 — prepare GitHub for recruiter review

1. Keep the current repository private until Harrison chooses an access strategy.
2. Decide among specific private collaborators, a sanitized public mirror, or making the current repository public after a complete confidentiality/security review. Do not change visibility without explicit approval.
3. Publish the SHA-pinned CI workflow and Dependabot configuration only through an approved reviewed branch/push.
4. Use `release/**` for hosted candidate checks; do not push directly to `main` merely because local tests pass.
5. Because branch protection/rulesets are unavailable under the current private-repository plan, compensate with disciplined immutable commits, hosted CI, independent review, and explicit merge/deploy approval.
6. Enable available vulnerability/Dependabot/secret-scanning settings only after explicit approval and verify by read-back.
7. Require hosted CI to pass on the exact candidate before merge/promotion.
8. Ensure the README and portfolio evidence map clearly explain the product, architecture, trust boundaries, local verification, recruiter deployment, test billing, limitations, and Harrison’s contribution.

## Phase 3 — configure the current Vercel project as recruiter/demo

1. Keep `paperline-xi.vercel.app` as the stable recruiter URL.
2. Change Vercel Node.js from `24.x` to repository-pinned `22.x` after explicit approval; read the setting back.
3. Use deterministic install/build commands and a reviewed Git commit as deployment provenance.
4. Reconcile the recruiter project’s stable environment by variable name and scope without printing values.
5. Set:
   - `PAPERLINE_RECRUITER_DEMO=true`
   - `PAPERLINE_ALLOW_LIVE_STRIPE=false`
   - `NEXT_PUBLIC_APP_URL=https://paperline-xi.vercel.app`
   - exact recruiter host allowlists and redirect/webhook URLs
6. Use recruiter-specific or safely isolated provider resources:
   - candidate Clerk application
   - isolated recruiter Supabase database/storage
   - dedicated restricted OpenAI project/key with hard budget and conservative rate limits
   - Stripe **test mode only**, including test Prices, webhook secret, Customers/subscriptions, and test payment methods
   - recruiter monitoring/readiness configuration
7. Fail closed if a live Stripe secret is supplied, even if another flag is incorrect.
8. Keep OpenAI credentials server-side only. Never commit, render, log, or send them to recruiters. Document that OpenAI calls can still bill Harrison’s account; cap usage and define rotation/revocation after recruiting.
9. Do not copy commercial/live financial records or unrelated user data into the recruiter environment.
10. Obtain explicit approval before any Vercel, Clerk, Supabase, Stripe, OpenAI, Sentry, DNS, or other dashboard mutation.

## Phase 4 — hosted CI and recruiter deployment

1. Obtain explicit approval for branch creation/commit/push and any Git-triggered Vercel deployment.
2. Before pushing `release/**`, verify project-wide `git.deploymentEnabled=false` so every Git branch is CI-only. The recorded project currently has zero Preview variables, so no Git-triggered Preview is a valid candidate; approved recruiter deployments use the staged CLI flow from the exact reviewed SHA.
3. Push the reviewed candidate to an approved `release/**` branch and require hosted CI success on the exact SHA. Review hosted logs for secrets, provider failures, nondeterminism, and runtime mismatch.
4. After provider and migration approval, create a staged Production-target deployment from the exact reviewed SHA using Vercel's supported no-alias flow (`vercel --prod --skip-domain`). This uses the recruiter project's stable environment while leaving `paperline-xi.vercel.app` on the previous deployment.
5. Confirm Ready status, immutable deployment ID/URL, safe build/runtime logs, exact-commit provenance, and access to the staged URL.
6. Before migration, prove by provider project identity (never secret values) that the staged recruiter deployment's isolated Supabase target differs from the database used by the currently aliased deployment. If they are the same or identity cannot be proven, stop: first prove the currently aliased application is backward-compatible with post-`0018` schema in a disposable/clone environment or establish an approved traffic-isolation maintenance procedure. Never migrate a database still serving an unproven old alias.
7. Apply recruiter-database migrations `0017` and `0018` in order only to the approved isolated recruiter database after the identity/compatibility gate, legacy-state preflight, backup/restore evidence, ordered review, and explicit approval. Read schema/RPC/cleanup-queue state back after application.
8. Complete every mandatory recruiter-runtime acceptance test against the staged immutable deployment before alias movement.
9. Prove rollback semantics after migration. Either verify that the previous aliased application/provider stack remains a safe rollback or document and test the actual application rollback plus database forward-fix/restore procedure. A retained deployment URL alone is not proof of rollback.
10. Obtain separate explicit approval, then promote the accepted immutable deployment to `paperline-xi.vercel.app`. Re-run the critical public/auth/provider smoke suite on the stable alias.
11. Do not attach `paperline.io`.

## Phase 5 — recruiter runtime acceptance

Use synthetic documents, test users, and provider test data only. Record exact deployment identity.

Verify:

1. Public homepage, recruiter copy, pricing/demo disclosures, support link, legal pages, security headers, console, and responsive/accessibility basics.
2. Sign-up/sign-in, redirect origins, invitation behavior, protected-route handling, and signed-out denials.
3. Two synthetic users and two workspaces, including cross-tenant negative tests for document, extraction, chat, workflow, storage, API-key, billing, and identifier substitution paths.
4. Upload and processing for representative synthetic PDF, scanned PDF, DOCX, TXT, PNG, and JPEG fixtures; bounded malformed/oversized failures.
5. Structured extraction, confidence/citation display, cited chat, workflow/template behavior, retry/error states, and safe provider failures.
6. Document deletion, workspace deletion, lifecycle ownership/fencing, interrupted-operation recovery, and storage cleanup.
7. Stripe test checkout, recruiter notice, duplicate subscription prevention, portal, payment-method UX, cancellation, entitlement transitions, reordered/duplicate webhooks, and proof that no live Stripe call is reachable.
8. MCP credential creation, workspace scoping, least privilege, expiration, rotation/revocation, foreign-ID denial, and safe errors if MCP is included in the recruiter experience.
9. OpenAI cost/rate controls, no client key exposure, no raw private text/provider payloads in logs, and post-recruiting key revocation instructions.
10. Health/readiness, monitoring receipt, stable public errors, rollback smoke test, and prior-deployment recovery procedure.

A local build does not satisfy runtime acceptance. Mark provider-dependent checks blocked until they are exercised against the exact staged recruiter deployment. The following are non-waivable release gates: exact-commit provenance, hosted CI, target migration behavior, two-user/two-workspace isolation, live-Stripe denial, secret safety, health/readiness and monitoring receipt, and a tested rollback/forward-fix procedure. Optional functionality may be deferred only when it is removed from the recruiter path or visibly labeled unavailable.

## Phase 6 — recruiter-facing GitHub and portfolio package

1. Make the repository landing experience concise, polished, and truthful.
2. Provide a 30-second overview, architecture/trust-boundary diagram, evidence map, setup/run instructions, test commands, environment-name matrix, deployment topology, limitations, and recruiter-demo notice.
3. Present Paperline as the product. Keep Ops Agent explicitly labeled as a supporting synthetic example.
4. Link support to `https://olveraproductions.com/support`.
5. Include only sanitized screenshots/video/assets explicitly approved for publication.
6. Keep security-sensitive operational detail sufficient to demonstrate engineering judgment without exposing secrets or dangerous live-system instructions.
7. Reconcile every resume/portfolio claim with executable source, tests, or recruiter-runtime evidence.
8. Provide concise interview talking points covering architecture, applied AI, tenancy, lifecycle correctness, Stripe idempotency, prompt-injection boundaries, CI, deployment separation, tradeoffs, and known limitations.

## Canonical local verification gate

Run with `.env.local` isolated and restored, recruiter mode enabled, and live Stripe disabled:

- frozen install
- template validation
- extraction evaluation
- demo readiness
- security regressions
- lifecycle source regressions
- disposable PostgreSQL migration/behavior tests
- unsafe legacy-state preflight
- readiness validation
- parser runtime tests
- MCP behavior tests
- TypeScript
- ESLint
- production build
- production dependency audit
- Actionlint
- whitespace/final-newline checks
- exact-candidate Gitleaks
- Git-history Gitleaks

Do not weaken assertions merely to obtain green output. Record meaningful versions, timings, page counts, immutable manifest, and any measured extraction limitations.

## Approval gates

Read-only inspection and local code/test/document changes are allowed. Stop and obtain explicit approval immediately before:

- staging, committing, branching, pushing, merging, or changing repository visibility
- enabling or changing GitHub repository settings
- any Git-triggered or direct Vercel deployment
- changing Vercel project settings, aliases, domains, or environment variables
- changing Clerk, Supabase, Stripe, OpenAI, Sentry, email, or other provider configuration
- applying any remote migration or creating/deleting remote data/resources
- attaching domains or changing DNS
- sending recruiter outreach, applications, posts, or public announcements
- paid actions, live transactions, destructive operations, or production cutover

Approval of a checklist or goal does not silently approve all later side effects. Ask at the point of action and state exactly what will change.

## Definition of done

The recruitment-portfolio deployment is complete only when:

- the exact reviewed Git commit is deployed to `paperline-xi.vercel.app`
- hosted CI passes for that commit
- every non-waivable recruiter-runtime gate passes: exact-commit provenance, hosted CI, target migration behavior, two-user/two-workspace isolation, live-Stripe denial, secret safety, health/readiness and monitoring receipt, and tested rollback/forward-fix
- any deferred optional feature is removed from the recruiter path or visibly labeled unavailable, with the limitation documented and accepted
- recruiter mode and Stripe test-only behavior are visibly and technically enforced
- provider resources are isolated, budget-limited, and removable
- no credentials/private artifacts are present in Git, client bundles, deployment logs, or public materials
- GitHub access/visibility is intentionally chosen and recruiter-facing documentation is polished
- the previous recruiter deployment/provider stack is proven safe after recruiter migration, or a tested application rollback plus database forward-fix/restore procedure replaces it
- `paperline.io` remains detached and the commercial launch remains **ON HOLD / NO-GO**
- the release checklists, readiness docs, claims ledger, and portfolio evidence are synchronized with final facts

At the final gate, verify the complete recruiter-site evidence and report a concise go/no-go decision with residual risks and rollback instructions.
