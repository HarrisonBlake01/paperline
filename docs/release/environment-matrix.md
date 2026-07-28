# Paperline secure runtime environment matrix

Values are intentionally omitted. Configure through approved platform secret stores; never commit runtime values.

| Variable | Local development | Candidate | Production | Sensitivity / purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Required | Required immutable/candidate URL | Required canonical URL | Public origin; drives auth/email/origin policy. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Test/dev | Candidate instance/key | Production key | Public Clerk key. |
| `CLERK_SECRET_KEY` | Test/dev secret | Candidate secret | Production secret | Server authentication; never client-exposed. |
| `CLERK_WEBHOOK_SECRET` | Optional local fixture | Required | Required | Signature verification. |
| `NEXT_PUBLIC_SUPABASE_URL` | Local/test | Candidate project | Production project | Public project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local/test | Candidate key | Production key | Public/limited key; RLS dependent. |
| `SUPABASE_SERVICE_ROLE_KEY` | Local/test secret | Candidate secret | Production secret | Bypasses RLS; server only. |
| `SUPABASE_BUCKET_DOCUMENTS` | `documents` default | Required/private | Required/private | Bucket must not be public. |
| `OPENAI_API_KEY` | Test secret | Candidate secret/budget | Production secret/budget | Paid parser/AI path. |
| `OPENAI_EXTRACTION_MODEL` | Explicit | Explicit | Explicit | Versioned behavior/cost. |
| `OPENAI_CHAT_MODEL` | Explicit | Explicit | Explicit | Versioned behavior/cost. |
| `OPENAI_EMBEDDING_MODEL` | Explicit | Explicit | Explicit | Must match vector dimension. |
| `PAPERLINE_OCR_MAX_PDF_PAGES` | Bounded | Bounded | Bounded | Denial-of-wallet control. |
| `PAPERLINE_OCR_IMAGE_DETAIL` | Explicit | Explicit | Explicit | Cost/quality. |
| `PAPERLINE_OCR_MAX_ATTEMPTS` | Bounded | Bounded | Bounded | Retry amplification control. |
| `PAPERLINE_OCR_CONCURRENCY` | Bounded | Bounded | Bounded | Provider/runtime concurrency. |
| `PAPERLINE_MCP_ALLOWED_HOSTS` | Localhost implicit in non-production | Exact candidate host | Exact canonical/approved aliases | Host-header boundary; production fails closed when empty. |
| `PAPERLINE_MCP_ALLOWED_ORIGINS` | Empty unless web client tested | Reviewed origins only | Reviewed origins only | Native clients omit Origin; no wildcard. |
| `PAPERLINE_READINESS_TOKEN` | High-entropy test secret | Independent candidate secret | Independent production secret | Protects dependency-readiness details. |
| `STRIPE_SECRET_KEY` | Test only | Test only | Test until launch approval | Live keys rejected by default. |
| `STRIPE_WEBHOOK_SECRET` | Test fixture | Candidate endpoint | Production endpoint | Signature verification. |
| `PAPERLINE_ALLOW_LIVE_STRIPE` | `false` | `false` | `false` until explicit approval | Fail-closed live billing gate. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional | Candidate project after scrub review | Production project after scrub review | No document/token capture. |
| `SENTRY_AUTH_TOKEN` | Build secret if needed | Platform secret | Platform secret | Never runtime/client. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Approval-gated | Approval-gated | Product telemetry; privacy/retention review. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Explicit | Explicit | Explicit | CSP/egress dependency. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Test/sandbox | Approved test sender | Verified production sender | No production email during candidate tests. |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Optional | Only if queue enabled | Required only for approved queue | Queue not current runtime proof. |

## Environment rules

- Use a separate Vercel candidate project with no production alias. Candidate and production must use different Clerk, monitoring, MCP readiness, and provider credentials.
- The currently linked Supabase project may serve as the candidate only after confirming it contains no important/production data, recording its project identity, and confirming backup/forward-fix posture. Otherwise create a new isolated Supabase project.
- Agent credentials are end-user workspace secrets stored as digests in Paperline; they are not environment variables on Paperline servers.
- In direct Hermes, the plaintext credential belongs in `~/.hermes/.env` and is referenced from config.
- In NemoClaw mode, the plaintext credential belongs in the OpenShell provider store and must not appear under `/sandbox/.hermes`.
- Never copy production secrets into local `.env.local`, test fixtures, screenshots, CI output, or release evidence.
- Current recruiter code through migration `0018` must never target a database whose migration identity, backup state, legacy lifecycle rows, and application compatibility have not been proven first.
- The stable recruiter project uses `https://paperline-xi.vercel.app`; immutable staging uses its assigned deployment origin until alias approval. Future commercial `https://paperline.io` requires a separate project/provider stack and remains frozen.
