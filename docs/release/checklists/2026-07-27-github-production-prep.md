# Paperline GitHub and recruiter deployment preparation — 2026-07-27

Status: **Final corrected local gate and follow-up Medium-finding fixes passed. Commit, push, provider mutation, migration, staged deployment, and recruiter-alias promotion remain approval-gated; commercial DNS remains frozen.**

This checklist supplements the verified candidate ledger in [`2026-07-19-secure-release.md`](./2026-07-19-secure-release.md). The executable pre-deployment test inventory and latest run evidence are maintained in [`2026-07-27-pre-deployment-test-matrix.md`](./2026-07-27-pre-deployment-test-matrix.md). This file records the exact current working tree and the additional GitHub/Vercel production gates.

## Target identities

- Local repository: `/Users/openclaw-server/.openclaw/workspace/paperline/app`
- Branch: `main`
- Local HEAD: `2d29bcc`
- Configured Git remote: `https://github.com/HarrisonBlake01/paperline.git`
- Last locally recorded `origin/main`: `5f1b69a`
- Vercel recruiter/demo project (its stable target is named `production` by Vercel): `harrisonolvera23-7297s-projects/paperline`
- Vercel project ID: `prj_OfKl0NNnacxQ5pTX3X0QNhNkbrMc`
- Supabase linked project ref: `yvouofuylmzrknratgyw`
- Future commercial domain (**FROZEN / OUT OF SCOPE**): `paperline.io`; `www.paperline.io` should eventually redirect to the apex

## A. Repository and migration reconciliation

- [x] Record branch, HEAD, remote, dirty tree, and untracked files.
- [x] Confirm local/remote Supabase migration parity through `0016` on 2026-07-27.
- [x] Reconcile lifecycle implementation as three ordered migrations: `0014_workspace_lifecycle.sql`, `0015_workspace_operation_fencing.sql`, and `0016_workspace_billing_claim.sql`.
- [x] Patch newly published production dependency advisories: Next.js/eslint-config-next 16.2.12, MCP SDK 1.30.0, Sentry 10.68.0, and narrow patched transitive overrides. `pnpm audit --prod --audit-level=high` reports no known vulnerabilities before the final rerun.
- [x] Scope CI placeholder provider variables to the production-build step; offline repository tests must not contact a fake Supabase host.
- [x] Run release gates for pull requests, `main`, and `release/**` branches.
- [x] Pin GitHub Actions to reviewed commit SHAs and enforce changed-line whitespace checks in hosted CI.
- [x] Review the complete tracked and untracked release diff; independent review produced the application blockers recorded below.
- [x] Run the pre-fix complete local/CI-equivalent release gate with `.env.local` absent and provider placeholders scoped only to `next build`; that evidence was superseded by the lifecycle/checkout correction tree.
- [x] Run the final post-fix clean gate and exact-candidate/history Gitleaks scans recorded in section G below.

## B. Private/generated artifact boundary

- [x] Keep `docs/portfolio/private-recruiter-case-study/` out of the application repository candidate via `.gitignore`.
- [x] Add `.vercelignore` defense-in-depth so local Vercel CLI uploads also exclude the private recruiter package and local-only agent/Supabase state.
- [x] Confirm no private recruiter media, QA frames, narration, deck, or generated preview is tracked or staged; the package is ignored as a unit.
- [ ] Decide separately whether source-only recruiter materials belong in a private portfolio repository; they are not part of this deployment.

## C. GitHub readiness

- [x] Add `.github/workflows/ci.yml` for Node 22 / pnpm 10.33.4 install, all local non-mutating test suites, lint, production build, high-severity production dependency audit, and Gitleaks.
- [x] Add weekly npm and monthly GitHub Actions Dependabot configuration.
- [x] Authenticate GitHub CLI on this Mac without placing credentials in chat or repository files. Verified active keyring-backed account `HarrisonBlake01`; HTTPS Git credential helper was configured and `git ls-remote` succeeded.
- [x] Read back repository visibility, default branch, Git integration, and current branch rules after authentication. `HarrisonBlake01/paperline` is private with default branch `main`; remote `main` is `5f1b69a53cff5ee00f7f6ca576da993b7c179397`, while local HEAD is two commits ahead before the dirty candidate changes.
- [x] **Git deployment policy:** `vercel.json` sets `git.deploymentEnabled=false`, making every branch hosted-GitHub-CI-only. The project has zero Preview variables; no recruiter or future commercial credentials are copied into Preview. Approved recruiter deployments use the staged CLI flow from an exact SHA.
- [ ] Push a non-production release branch only after the preceding Vercel-Preview policy is verified and the owner explicitly approves branch/commit/push.
- [ ] Verify the GitHub Actions workflow passes on the pushed branch.
- [!] Require the release-gate checks on `main` before merge if the repository plan supports branch protection/rulesets. GitHub returned `403`: this private repository's current plan does not support branch protection/rulesets.
- [!] Verify GitHub secret scanning and Dependabot alerts are enabled where available. Read-back reports vulnerability alerts, Dependabot alerts, and secret scanning are currently disabled.
- [x] Confirm whether Vercel Git integration treats `main` as the production branch. Vercel is linked to `HarrisonBlake01/paperline`, production branch `main`, with automatic custom-domain assignment enabled. A push to `main` can deploy automatically and therefore requires production-deployment approval, not merely Git-push approval.
- [ ] Disable or approval-gate Vercel production auto-deploy until the protected GitHub release checks pass; prohibit direct pushes to the production branch.

## D. Vercel recruiter/demo project reconciliation

- [x] Inspect project identity and environment-variable names without printing values.
- [ ] Change the Vercel project Node.js setting from the currently reported `24.x` to the repository-pinned `22.x`, then read it back.
- [ ] Pin dashboard install/build settings to `pnpm install --frozen-lockfile` and `pnpm build` if `vercel.json` is not the effective source, then read them back.
- [ ] Configure the current project for the stable recruiter site at `paperline-xi.vercel.app`: candidate Clerk/Supabase, restricted OpenAI project, readiness secret, Stripe test mode, and `PAPERLINE_RECRUITER_DEMO=true`.
- [ ] Add/verify recruiter variable names currently absent: `CLERK_WEBHOOK_SECRET`, Stripe test secret/publishable/Price/webhook variables, `PAPERLINE_RECRUITER_DEMO=true`, and `PAPERLINE_ALLOW_LIVE_STRIPE=false`.
- [ ] Verify `PAPERLINE_MCP_ALLOWED_HOSTS` and `NEXT_PUBLIC_APP_URL` contain the exact recruiter host `paperline-xi.vercel.app`.
- [x] Keep `paperline.io` and `www.paperline.io` detached from the recruiter project. Future product production will use a separately configured Vercel project and provider stack.
- [ ] Configure Cloudflare DNS only after the separate future production deployment passes smoke tests and receives explicit approval.

## E. Application release blockers from independent review

- [x] Make workspace deletion owner-tokened, require exact-token release/pause/finalization, renew ownership around destructive effects, and prohibit reactivation after the durable destructive point of no return.
- [x] Replace document deletion's multi-step relational cleanup with one operation-tokened transaction/RPC and block its claim while an upload or explicit reprocessing lease is active.
- [x] Preserve shared chats during document deletion: unlink the target document and delete only chats with no remaining document links.
- [x] Add tested stale-owner recovery for interrupted workspace/document deletion while fencing the old claimant.
- [x] Replace the unbounded `billing` state with an owner-tokened, expiring/reclaimable billing operation and stale-recovery path.
- [x] Persist and reuse one logical checkout operation and deterministic Stripe customer/session idempotency identity across retries.
- [x] Persist pending Checkout Sessions, reconcile/expire them before deletion, paginate all subscriptions, fail closed on billing-verification errors, and lifecycle-fence webhook updates.
- [x] Prevent a second paid subscription, separate entitlement-bearing from deletion-blocking Stripe statuses, clear terminal subscription IDs, and retrieve authoritative subscription state before applying out-of-order webhook deliveries.
- [x] Validate both `OLD.workspace_id` and `NEW.workspace_id` on tenant-row moves and test direct deletes/join-table writes while a workspace is non-writable.
- [x] Add regression coverage for concurrent/stale workspace deletion ownership, the destructive phase, interrupted document deletion, active upload leases, and multi-document chat deletion.
- [x] Add regression coverage for stale billing recovery, dropped-response checkout retry, subscription pagination/status policy, duplicate-subscription policy, and webhook/deletion fencing.
- [x] Complete adversarial review `deleg_ce9a1973`. It confirmed prior Stripe, legacy-state, ownership, and webhook corrections and found one remaining Medium: a stale takeover could not resume an already-destructive workspace claim.
- [x] Make `begin_workspace_destructive_deletion` idempotent for the current owner in either `preflight` or `destructive`, and add a PostgreSQL behavior test covering pause, stale takeover, repeated phase entry, non-release, and final deletion. The complete corrected gate passed.
- [x] Complete narrow independent verification `deleg_631ff140`: the previously reported Medium is resolved, token fencing and non-release remain intact, targeted lifecycle/DB tests pass, and no new Medium+ issue was found.

## G. Final local post-fix evidence — 2026-07-27

- Candidate basis: local `main` HEAD `2d29bcce3131f38165b9da36e000dacea2e92f7a` plus intentionally unstaged tracked and untracked/non-ignored files. Staged file count: `0`.
- Exact application-candidate manifest, excluding both self-referential 2026-07-27 release ledgers: `8b151f2d13b615914a8c847c9654569aa2dbb8ae432e4d803de7c8aab978bfb4`; file count: `274`. The manifest is path-plus-file-SHA-256 framed with NUL separators and then SHA-256 hashed.
- `.env.local` was moved out before the clean gate and restored by a shell trap. CI placeholders were scoped only to `next build`; `PAPERLINE_ALLOW_LIVE_STRIPE=false`.
- `pnpm install --frozen-lockfile` — passed; lockfile already current.
- `pnpm test:templates` — passed; live Supabase check skipped because provider variables were intentionally absent.
- `pnpm test:extraction-eval` — passed: normalized accuracy `75.00%`; presence F1 `94.12%`; list-item F1 `85.71%`.
- `pnpm test:demo` — passed.
- `pnpm test:security` — passed.
- `pnpm test:lifecycle` — passed, including deterministic checkout identity, status-by-status entitlement/deletion policy, mismatched-subscription handling, paginated Stripe subscription inspection, durable Storage-cleanup contracts, and bounded cleanup retry backoff.
- `pnpm test:lifecycle-db` — passed in disposable `pgvector/pgvector:pg16`: clean migrations through `0018`, lifecycle/RPC behavior, cleanup-queue privilege/cascade behavior, plus an upgrade-state test proving `0017` aborts with `paperline_0017_legacy_deleting_workspace_requires_manual_reconciliation` rather than reactivating an ownerless legacy deletion.
- `pnpm test:readiness` — passed its controlled dependency-failure behavior and validated 30 required artifacts.
- `pnpm test:parser-runtime` — passed: 11 text pages and 243,767 rendered bytes.
- `pnpm test:mcp` — passed.
- `pnpm lint` — passed.
- CI-placeholder `pnpm build` — passed with Next.js `16.2.12`: compile `6.1s`, TypeScript `4.6s`, and `22/22` static pages generated.
- `pnpm audit --prod --audit-level=high` — `No known vulnerabilities found`.
- Local `actionlint .github/workflows/ci.yml` and the exact SHA-256-pinned `rhysd/actionlint:1.7.8` Docker image used by hosted CI — passed.
- Changed/new candidate text final-newline validation — passed; hosted CI runs the same changed-file check.
- `git diff --check` and changed/untracked text-file final-newline validation — passed. An initial all-repository newline probe included unchanged legacy design references and binary/SVG fixtures and was correctly not used as candidate-diff evidence.
- Gitleaks `8.30.1` exact tracked plus untracked/non-ignored candidate scan — passed; approximately 23.98 MB scanned, no leaks.
- Gitleaks Git-history scan — passed; 22 commits / approximately 1.77 MB scanned, no leaks.
- Post-gate footer-support addition — added a `Support` footer link to the dedicated Olvera Productions support destination at `https://olveraproductions.com/support`. The destination is deployed and returns `200`. `pnpm lint`, production `pnpm build`, and `git diff --check` passed for Paperline; no support SLA or unsupported capability was introduced.
- Recruitment goal activation — created `docs/goals/complete-paperline-recruiter-portfolio-deployment.goal.md`, marked the two commercial-oriented goals historical, froze `paperline.io`, and completed bounded independent review and correction passes.
- Git deployment protection — set supported project-wide `git.deploymentEnabled=false` in `vercel.json`, preventing every branch from creating an invalid zero-variable Vercel Preview. The current Vercel schema supports the boolean form; JSON syntax, workflow lint, security regressions, exact-candidate/history Gitleaks, and candidate manifest verification are required.
- Intermediate harness/source-contract failures encountered while incorporating review corrections were fixed and superseded by the complete passing gate above.
- Follow-up adversarial review confirmed four Medium pre-commit findings. All were corrected locally: credential backups are excluded from Vercel and moved outside the repository; Git-triggered Vercel deployment is disabled project-wide; durable orphaned-Storage cleanup migration `0018` plus bounded reconciliation/tests were added; and hosted CI now runs explicit TypeScript, pinned Actionlint, and changed/new-file final-newline gates.
- Final marker: `PAPERLINE_FINAL_CORRECTED_LOCAL_GATE_PASS`. Production build compiled in `7.2s`, TypeScript completed in `4.8s`, generated `22/22` static pages, and `pnpm audit --prod --audit-level=high` reported no known vulnerabilities.
- Exact-candidate Gitleaks scanned approximately `24.04 MB` with no leaks; Git-history Gitleaks scanned `22` commits / approximately `1.77 MB` with no leaks.
- Hosted GitHub Actions run [`30354886674`](https://github.com/HarrisonBlake01/paperline/actions/runs/30354886674) passed on substantive candidate SHA `6622c2303e942a6536afdb316d7298d1d7885d3f`: both **Secret scan** and **Test, lint, build, and audit** completed successfully. The first secret-job attempt hit a Docker Hub connection reset; the approved failed-job rerun passed without changing the SHA.

### Remaining local-to-production blocker

- Before applying `0017`, query production for `lifecycle_state='deleting' AND lifecycle_operation_token IS NULL`. Migration `0017` deliberately fails closed if such an `0015` legacy claim exists. Inspect and reconcile that workspace through a controlled recovery procedure; do not automatically reactivate it because destructive work may already have occurred.
- Migrations `0017`–`0018` are local only. Production backup, ordered migration review/application, and post-application read-back require separate explicit approval.

## F. FUTURE COMMERCIAL — `paperline.io` production release gate (FROZEN / OUT OF SCOPE)

- [ ] Record owner acceptance or mitigation of the backup residual: daily database backups, PITR disabled, and no retained off-site Storage-object backup.
- [ ] Record the CSP decision: keep measured Report-Only temporarily or approve a tested enforced nonce/hash policy after canonical-domain observation.
- [ ] Record the paid-launch decision: fully configure live Stripe, or explicitly hide/disable paid upgrade actions for initial launch.
- [ ] Capture the pre-deploy production deployment/alias for rollback.
- [ ] Require a clean working tree, recorded reviewed commit SHA/tree, exact candidate manifest, and matching secret-scan evidence before any direct Vercel CLI production deployment. Prefer deploying the protected Git commit rather than a local working tree.
- [ ] Obtain separate explicit approval for commit, Git push, any Git-triggered Vercel deployment, direct production deployment, domain/alias promotion, and Cloudflare DNS publication.
- [ ] Create a separate future production Vercel project and one immutable production deployment from the reviewed commit; do not convert or reuse the recruiter project/provider stack.
- [ ] Verify Ready state, safe logs, `/api/health`, protected `/api/readiness`, signed-out redirects, signed-in upload/parse/extract/cited-chat flow, tenant negatives, four-tool MCP behavior and revocation, Clerk webhook, Sentry receipt, security headers, and rollback eligibility.
- [ ] Route `paperline.io` only after the immutable deployment passes.

## Current decision

- **Local GitHub/deployment safeguards:** PREPARED AND LOCALLY VERIFIED; the complete corrected gate, final independent review, exact-candidate secret scan, and history scan pass.
- **GitHub push:** BLOCKED by explicit branch/commit/push approval and candidate cleanup/review; authentication is now working. No remote workflow exists yet because the local CI file has not been pushed.
- **Recruiter deployment:** NO-GO pending the pre-deployment matrix's candidate/provider tests, recruiter-database legacy-state preflight/migration approval, authenticated external configuration verification, and the approval gates above. The linked Olvera Productions support destination is deployed and verified publicly.
- **Commercial canonical-domain launch:** FROZEN / OUT OF SCOPE. `paperline.io` remains detached pending a separate future project, smoke tests, domain attachment, and DNS approval.
