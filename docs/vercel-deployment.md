# Vercel Deployment — Paperline

This repo is Vercel-ready as a Next.js 16 app using pnpm.

## Project settings

Use these settings when importing `HarrisonBlake01/paperline` into Vercel:

- **Framework preset:** Next.js
- **Root directory:** repository root
- **Install command:** `pnpm install --frozen-lockfile`
- **Build command:** `pnpm build`
- **Output directory:** `.next` (Vercel auto-detects this)
- **Node version:** 22.x (pinned in `package.json`)
- **Stable recruiter URL:** `paperline-xi.vercel.app`

`vercel.json` pins the framework/build/install settings so the dashboard and CLI stay consistent.

The current project is the recruiter/demo project even though Vercel names its stable target “Production.” `paperline.io` is reserved for a future, separate commercial project and must not be attached here.

## Required recruiter/demo environment variables

The app intentionally fails fast in production if these are missing:

```text
NEXT_PUBLIC_APP_URL=https://paperline-xi.vercel.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
PAPERLINE_RECRUITER_DEMO=true
PAPERLINE_ALLOW_LIVE_STRIPE=false
PAPERLINE_MCP_ALLOWED_HOSTS=paperline-xi.vercel.app
PAPERLINE_READINESS_TOKEN=
```

## Recommended environment variables

Add these before testing the full SaaS flow:

```text
NEXT_PUBLIC_APP_NAME=Paperline
NEXT_PUBLIC_BRAND_OWNER=Olvera Productions
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
CLERK_WEBHOOK_SECRET=
SUPABASE_BUCKET_DOCUMENTS=documents
OPENAI_EXTRACTION_MODEL=gpt-5.4
OPENAI_CHAT_MODEL=gpt-5.4
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
PAPERLINE_OCR_MAX_PDF_PAGES=10
PAPERLINE_OCR_IMAGE_DETAIL=high
PAPERLINE_OCR_MAX_ATTEMPTS=2
PAPERLINE_OCR_CONCURRENCY=3
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_TEAM_MONTHLY=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
DEMO_WORKSPACE_SLUG=demo
```

Optional services can stay empty until enabled:

```text
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
DEMO_WORKSPACE_ID=
```

## CLI deployment procedure

The local repository is linked to Vercel project `paperline`. Before deployment, inspect the project and reconcile the dashboard Node version with the repository-pinned Node 22.x; the 2026-07-27 inspection reported Node 24.x.

```bash
cd /Users/openclaw-server/.openclaw/workspace/paperline/app
vercel project inspect paperline
vercel env ls production
# Only after commit-bound CI, provider, migration, and deployment approval.
# This uses the stable recruiter environment without moving the stable alias:
vercel --prod --skip-domain
```

If using the Vercel dashboard instead:

1. Keep the existing `paperline` project bound to `HarrisonBlake01/paperline` as the recruiter/demo project.
2. Configure the stable target with recruiter-only provider resources and the variables above. Do not copy commercial/live financial data.
3. Keep Preview unconfigured unless a complete isolated Preview stack is deliberately provisioned. `git.deploymentEnabled=false` makes every Git branch CI-only; approved recruiter deployments use the staged CLI flow.
4. Set Clerk and Stripe **test-mode** webhook/redirect URLs to the exact recruiter host.
5. Stage the reviewed commit with `vercel --prod --skip-domain`, complete acceptance on the immutable deployment, then move `paperline-xi.vercel.app` only after separate alias approval.
6. Never add `paperline.io` or `www.paperline.io` to this project. Create a separate commercial project only when that frozen track is explicitly resumed.

## Verification

Run the complete local release gate in `docs/release/production-readiness.md` before deploying. The short smoke subset is:

```bash
pnpm lint
pnpm build
```

After deploy:

```bash
curl https://paperline-xi.vercel.app/api/health
```

Then execute the recruiter runtime matrix in `docs/release/checklists/2026-07-27-pre-deployment-test-matrix.md` using synthetic users, documents, and Stripe test data only.
