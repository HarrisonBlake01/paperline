# Paperline security maintenance — 2026-08-08

Status: **Complete locally — approval required before branch/commit/push and recruiter deployment.**

## Scope and identities

- Canonical repository: `/Users/openclaw-server/.openclaw/workspace/paperline/app`
- Isolated detached worktree: `/Users/openclaw-server/.hermes/cache/paperline-pdfjs-fix`
- Base: GitHub PR #7 merge candidate (`1043a573bd6f92ba9d0a9a2a19bcdd0b23bcb39c`) over `origin/main` `a09867b1144753d03f4cbfea1c40c874cb66b352`
- Stable recruiter URL: `https://paperline-xi.vercel.app`
- Current stable deployment: `dpl_9eogpM3ax6Xn4bnvfLsrg3gDp6yx` (Ready; built 2026-07-29)
- Commercial `paperline.io`: frozen and out of scope

## Trigger

GitHub reports open High alerts for:

- `pdfjs-dist` `>=5.6.83 <6.2.108` (`GHSA-hq66-cqwq-w95j`; alerts 5 and 6)
- `fast-uri` `>=3.0.0 <3.1.5` (`GHSA-7p8r-x3mc-p8w7`; alert 4)
- `brace-expansion` `>=4.0.0 <5.0.9` (`GHSA-rgw5-rvv9-x895`; alert 3)

Dependabot PR #7 upgrades only the direct `pdfjs-dist` dependency. Its hosted release gate fails because `pdf-parse@2.4.5` pins PDF.js `5.4.296` and its worker while the direct PDF.js upgrade changes runtime/native-canvas resolution. The parser runtime fails with an `@napi-rs/canvas` `InvalidArg` path error.

## Local correction

- Replaced the `pdf-parse` wrapper with direct, pinned `pdfjs-dist@6.2.108` text extraction and rendering.
- Upgraded `@napi-rs/canvas` to `1.0.3` so PDF.js and the application use compatible Path/Canvas implementations.
- Removed `pdf-parse` and `@types/pdf-parse`.
- Kept PDF.js and native canvas server-only and externalized for the Next.js runtime.
- Added a static worker-module readiness import and a narrow module declaration so deployment tracing and TypeScript both cover the worker artifact.
- Preserved per-page cleanup and loading-task destruction.
- Kept scanned-PDF rendering bounded by `OCR_LIMITS.maxPdfPages`; output remains PNG at the established 2000-pixel width.
- Updated source-contract regression checks for the direct PDF.js boundary.
- Raised overrides to `fast-uri@3.1.5`, `brace-expansion@5.0.9`, `nanoid@3.3.17`, `hono@4.12.34`, and `dompurify@3.4.13` for newly disclosed advisories.
- Addressed the independent review findings and residual decompression/packaging concerns:
  - Added route-scoped output tracing for the parser isolate, PDF.js package/worker/fonts, and native canvas artifacts; clean-build upload and document-processing traces contain the parser worker, `6.2.108` PDF.js assets, and `1.0.3` native binary.
  - Enforced a 250-page and 200,000-character ceiling while consuming `streamTextContent()` incrementally inside a dedicated worker thread.
  - Capped that untrusted parser isolate at 192 MiB old-generation heap, 32 MiB young-generation heap, a 4 MiB stack, and a parent-enforced 10-second deadline before classification, chunking, or embeddings.
  - Added a pnpm patch for `pdfjs-dist@6.2.108` that charges decoded-stream allocations in both `DecodeStream.ensureBuffer` and `DecompressionStream` output, with a 32 MiB production budget and deterministic `pdf_decoded_stream_limit_exceeded` rejection.
  - Kept package resolution inside the explicitly traced, unbundled source workers; compiled parents use reflective `worker_threads.Worker` construction and contain no PDF.js resolver, Turbopack worker chunk, module-ID path rewrite, or dynamic-resolve throw.
  - Moved OCR/page rendering into a dedicated per-page isolate (`pdf-render-worker.mjs`) that installs the same 32 MiB decoded-stream budget before PDF.js import, with a 15-second parent deadline and V8 resource limits.
  - Added finite/dimension/pixel canvas validation and changed the OCR path to render, consume, and release one page at a time rather than retaining every PNG.
- Added synthetic 251-page, pathological page-box, and compact Flate-compressed operator-bomb regressions.

## Executed evidence

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm test:templates`
- [x] `pnpm test:extraction-eval` — normalized accuracy `75.00%`; presence F1 `94.12%`; list-item F1 `85.71%`
- [x] `pnpm test:demo`
- [x] `pnpm test:security`
- [x] `pnpm test:lifecycle`
- [x] `pnpm test:lifecycle-db` — `lifecycle-db-regressions-pass`; `lifecycle-legacy-preflight-pass`
- [x] `pnpm test:readiness`
- [x] `pnpm test:parser-runtime` — 11 text pages; normalized per-page content hash unchanged; 244,167 rendered PNG bytes; 251-page, pathological page-box, compact operator-bomb, and compact image-bomb inputs rejected under production budgets
- [x] Clean-build document-route trace inspection — upload and processing traces include text worker, render worker, `pdfjs-dist` package/worker/fonts, and native canvas `1.0.3`
- [x] Clean production packaging inspection — compiled parents use `Reflect.construct(Worker, ...)`; no `[worker thread]-src_lib_parsing_*` chunks, dynamic-resolve throw, or `dirname(<moduleId>)` rewrite
- [x] Reconstructed trace-only artifact execution — recruiter fixture parsed as 11 pages / 7,119 characters; bounded operator fixture returned exact `pdf_decoded_stream_limit_exceeded`
- [x] CI-placeholder `pnpm build` — Next.js `16.2.12`; compile `9.3s`; `22/22` static pages
- [x] `pnpm audit --prod --audit-level=low` — no known vulnerabilities
- [x] `git diff --check`
- [x] Gitleaks `8.30.1` exact tracked plus untracked/non-ignored candidate scan — 282 files / 24.10 MB; no leaks
- [x] Gitleaks Git-history scan — 34 commits / 2.22 MB; no leaks
- [x] Deterministic NUL-framed path-plus-file-SHA-256 manifest (release ledger excluded) — 281 files; `eeee665b25490bfa495b2b21deb2275062240d4dd56a6c67ccc8817897b0b1ec`

Final local markers: `OCR_RENDER_ISOLATE_TARGETED_PASS`, `PAPERLINE_FINAL_FULL_LOCAL_MATRIX_PASS`, `PAPERLINE_FINAL_PACKAGING_PASS`, `PAPERLINE_FINAL_TREE_SECRET_SCAN_PASS`, and `PAPERLINE_FINAL_HISTORY_SECRET_SCAN_PASS`.

## Release gates and blockers

- [x] Independent read-only review reported `no open Medium+ findings` after text-decode, Turbopack packaging, and OCR-render isolation remediation.
- [x] Created clean maintenance branch `release/pdfjs-runtime-hardening-2026-08-08` from current `origin/main` and reproduced the reviewed 281-file manifest exactly.
- [x] Regenerated exact-candidate manifest and completed exact-tree plus history secret scans.
- [x] Explicit approval received for branch, commit, push, and protected immutable candidate staging; Vercel read-back confirmed `previewDeploymentsDisabled: true` before push while `main` remained the production branch.
- [x] Pushed initial reviewed commit `9619f1aeedc1c7a9916dd733624bc4f9ff4944f2`; hosted Release gates run `31289471086` passed on that exact SHA. Its superseded candidate `dpl_AS8WMPZisRz6Cu45rNvBAB4wd6Kr` was removed after replacement.
- [x] Independent fix-only review reported no Critical, High, Medium, or Low correctness/security finding and explicitly concluded `no open Medium+ security findings remain`.
- [x] Pushed exact fix-only runtime commit `954e3936e8ace4cb373d6871798b275a8f817741`; hosted Release gates run `31293319129` passed on that exact SHA, including parser-runtime, lifecycle DB, production build, audit, and secret scan.
- [x] Staged immutable Production-scoped candidate `dpl_5E9BX9gBNM6zYMaoFP6fRAMYrsmN` (`paperline-8wy9v1na8-harrisonolvera23-7297s-projects.vercel.app`) from that exact SHA. It is `READY`, SSO-protected, and unaliased.
- [x] Candidate `/api/health` returned `200`; authorized `/api/readiness` returned `200`, `ready: true`, with configuration, database, rate-limit schema, agent-credential schema, private storage, and `pdf_runtime` all healthy.
- [ ] Full remote upload/OCR/hostile-fixture acceptance remains blocked on application-level Clerk authentication. The deployed Clerk keyset differs from the available local keyset (`jwk-kid-mismatch`), and Vercel does not return encrypted secret values through Production `env pull`.
- [x] Rejected and deleted a temporary readiness-token QA harness after independent review found one Medium denial-of-service risk from exposing repeated 40 MiB fixture generation behind the shared readiness credential. All four failed QA deployments, one successful control deployment, the remote QA branch, temporary environment pulls, and local QA archives were removed. Final project state: `previewDeploymentsDisabled: false`; `protectionBypassCount: 0`.
- [x] The temporary harness exposed a production-build path where PDF.js enforced the image decode budget but swallowed `pdf_decoded_stream_limit_exceeded` and returned a blank render. The fix-only change rethrows the explicit budget error from modern and legacy PDF.js image decoders and preserves it across render-worker errors; no QA route is included. The regression uses a compact 33 MiB decoded image against the 32 MiB ceiling and requires the exact decoder error. Five consecutive runs passed after setting the secondary render-isolate old-generation cap to 256 MiB, ensuring the primary decode ceiling fires before the independent V8 containment boundary.
- [x] Complete fix-only local matrix passed: frozen install; templates; demo; security; lifecycle; disposable lifecycle DB plus legacy preflight; readiness; exact parser runtime; MCP; TypeScript; ESLint; production audit; clean Next.js build; whitespace; exact 282-file Gitleaks tree scan; and Git-history scan. The rejected QA route is absent from source.
- [x] Removed the superseded candidate, temporary fix/isolation worktrees, deployment archives, exact scan tree, response artifacts, and both automatically assigned candidate aliases. Final pre-promotion read-back: `previewDeploymentsDisabled: false`; `protectionBypassCount: 0`; SSO protection enabled.
- [x] Opened and merged PR `#8` into `main`; merge commit `c902a5ed30d9da7be6ab806851618b3565e73077` contains runtime commit `954e3936e8ace4cb373d6871798b275a8f817741`. Hosted Release gates run `31294081421` passed on that exact merge SHA.
- [x] Deployed exact merge commit with production alias assignment. Promoted deployment `dpl_D7TgeCgQsauEvyvR6BBNabT1gDBc` (`paperline-l2us2zpk4-harrisonolvera23-7297s-projects.vercel.app`) is now the production target.
- [x] Stable recruiter aliases moved to the remediated deployment and remain HTTP `200`:
  - `paperline-xi.vercel.app` → `dpl_D7TgeCgQsauEvyvR6BBNabT1gDBc`
  - `paperline-demo.olveraproductions.com` → `dpl_D7TgeCgQsauEvyvR6BBNabT1gDBc`
- [x] Production smoke checks passed after promotion:
  - public `/api/health` on both stable aliases returned `200` with `ok: true`
  - unauthorized public `/api/readiness` returned `401` / `unauthorized`
  - authorized public `/api/readiness` returned `200`, `ready: true`, including healthy `pdf_runtime`
  - temporary automation bypass was revoked immediately after immutable-deployment identity confirmation (`protectionBypassCount: 0`)
  - SSO protection remains enabled for non-custom deployment URLs
- [x] Previous production deployment `dpl_9eogpM3ax6Xn4bnvfLsrg3gDp6yx` remains `READY` as the explicit rollback target.
- [ ] Full signed-in remote upload/OCR/hostile-fixture acceptance remains blocked on application-level Clerk authentication. The deployed Clerk keyset differs from the available local keyset (`jwk-kid-mismatch`), and Vercel does not return encrypted secret values through Production `env pull`.
- [x] Dependabot High alert `#9` (`js-yaml` via eslint toolchain) closed by adding pnpm override `js-yaml@>=4.0.0 <4.3.1 -> 4.3.1` and refreshing the lockfile to `js-yaml@4.3.1`. Production dependency audit remains clean; this is a development-toolchain pin.

The currently promoted recruiter deployment is `dpl_D7TgeCgQsauEvyvR6BBNabT1gDBc` from merge commit `c902a5ed30d9da7be6ab806851618b3565e73077`. Public production is remediated for the PDF runtime hardening release. Rollback target remains `dpl_9eogpM3ax6Xn4bnvfLsrg3gDp6yx`.
