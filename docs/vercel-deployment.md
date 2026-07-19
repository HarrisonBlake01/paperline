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
- **Production domain:** `paperline.io`

`vercel.json` pins the framework/build/install settings so the dashboard and CLI stay consistent.

## Required production environment variables

The app intentionally fails fast in production if these are missing:

```text
NEXT_PUBLIC_APP_URL=https://paperline.io
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
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
PAPERLINE_ALLOW_LIVE_STRIPE=false
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_TEAM_MONTHLY=
RESEND_API_KEY=
EMAIL_FROM="Paperline <hello@paperline.io>"
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

## CLI setup once authenticated

The local machine currently needs Vercel auth before I can create/link the project from here:

```bash
vercel login
cd /Users/openclaw-server/.openclaw/workspace/paperline/app
vercel link --project paperline
vercel env pull .env.vercel.local
vercel deploy --prod
```

If using the Vercel dashboard instead:

1. Import `HarrisonBlake01/paperline`.
2. Add the environment variables above for Production/Preview/Development as appropriate.
3. Add `paperline.io` in Project → Settings → Domains.
4. Update Clerk/Stripe webhook URLs after Vercel gives the production URL:
   - Clerk: `https://paperline.io/api/webhooks/clerk`
   - Stripe: `https://paperline.io/api/webhooks/stripe`
5. Set `NEXT_PUBLIC_APP_URL=https://paperline.io` in production.

## Verification

Run locally before deploying:

```bash
pnpm lint
pnpm build
```

After deploy:

```bash
curl https://paperline.io/api/health
```

Then test the mentor path in `docs/mentor-demo.md`.
