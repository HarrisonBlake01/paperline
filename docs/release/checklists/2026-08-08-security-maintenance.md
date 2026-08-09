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
- [ ] Push the exact commit with Preview deployments disabled; require hosted release gates to pass before immutable deployment.
- [ ] Stage an immutable Vercel deployment from that exact commit only after explicit deployment approval.
- [ ] Verify deployed `/api/readiness` reports `pdf_runtime` healthy and exercise a real synthetic text PDF plus rendered-page path.
- [ ] Obtain separate alias-promotion approval, then rerun public/auth/readiness/parser smoke checks.
- [ ] Confirm the GitHub High alerts close after the fixed dependency graph reaches the default branch.

The currently promoted recruiter deployment still contains `pdfjs-dist@5.7.284`; local success does not remediate the live deployment. No branch, commit, push, merge, provider mutation, deployment, alias movement, DNS change, or commercial release occurred in this maintenance pass.
