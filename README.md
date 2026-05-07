# Paperline

> Turn documents into answers.
> AI-powered document intelligence — a **ShadowProductions** product.

Paperline ingests PDFs, contracts, invoices, and reports, extracts structured
data, and lets you chat with your documents with full citations.

---

## Stack

| Layer        | Choice                                                |
| ------------ | ----------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + Turbopack                   |
| Language     | TypeScript                                            |
| Styling      | Tailwind v4 + custom design tokens (dark + light)     |
| Components   | shadcn/ui + Radix primitives                          |
| Auth         | Clerk                                                 |
| Database     | Supabase Postgres + pgvector                          |
| Storage      | Supabase Storage                                      |
| AI           | OpenAI (extraction, chat, embeddings)                 |
| Payments     | Stripe (Free / Pro / Team)                            |
| Email        | Resend                                                |
| Background   | Inngest                                               |
| Observability| Sentry + PostHog                                      |
| Hosting      | Vercel                                                |

---

## Pricing (live)

| Plan       | Price     | Pages / mo | Seats     | Highlights                                     |
| ---------- | --------- | ---------- | --------- | ---------------------------------------------- |
| Free       | $0        | 50         | 1         | 4 built-in templates, chat with citations       |
| Pro        | $29 / mo  | 1,000      | 3         | Custom templates, integrations, priority support |
| Team       | $99 / mo  | 10,000     | unlimited | API access, webhooks, SSO, priority queue       |
| Enterprise | Custom    | Custom     | unlimited | DPA / MSA, dedicated support, on-prem option    |

Single source of truth: [`src/lib/plans.ts`](./src/lib/plans.ts).

---

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in real keys
pnpm dev
```

Visit <http://localhost:3000>.

### Setting up the database

1. Create a new Supabase project (`paperline-dev`).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. Apply migrations with the Supabase CLI:

   ```bash
   pnpm supabase link --project-ref <project-ref>
   pnpm supabase db push
   ```

   The migrations in [`supabase/migrations/`](./supabase/migrations) are:

   - `0001_init.sql` — schema (workspaces, documents, chunks, templates, …)
   - `0002_rls.sql` — row-level security policies (Clerk-aware)
   - `0003_seed_templates.sql` — built-in Invoice / Contract / Resume / Report templates

4. Create a Storage bucket named `documents` (private).

### Setting up auth

1. Create a Clerk app, paste keys into `.env.local`.
2. In Clerk dashboard, configure the JWT template that Supabase uses for RLS
   (claim: `sub`).

### Setting up payments

1. Create a Stripe account (use **Test mode** during development).
2. In Stripe → Products, create:
   - **Paperline Pro** — recurring monthly $29 → put price id in `STRIPE_PRICE_PRO_MONTHLY`
   - **Paperline Team** — recurring monthly $99 → `STRIPE_PRICE_TEAM_MONTHLY`
3. Set webhook endpoint `https://<your-host>/api/webhooks/stripe` and put the
   signing secret in `STRIPE_WEBHOOK_SECRET`.

---

## Project layout

```
src/
  app/                       # App Router routes
    page.tsx                 # marketing landing
    sign-in/, sign-up/       # Clerk-hosted auth pages
    dashboard/               # signed-in home (placeholder)
  lib/
    plans.ts                 # pricing source of truth
    openai.ts                # OpenAI client + model defaults
    stripe.ts                # Stripe client
    supabase/server.ts       # service-role Supabase client
    utils.ts                 # cn(), formatBytes()
  middleware.ts              # Clerk protected routes

supabase/
  migrations/                # 0001_init.sql, 0002_rls.sql, 0003_seed_templates.sql

public/
  brand/                     # logo / brand sheet

design-refs/                 # Stitch HTML output (read-only references)
```

---

## Deployment

- **Vercel** project `paperline` (custom domain `paperline.io`).
- **Supabase** projects: `paperline-dev`, `paperline-prod`.
- **Clerk** instances: development + production.
- **Stripe** account: ShadowProductions (test → live).

Set every env var from `.env.example` in the Vercel project settings.

---

## License

Proprietary. © ShadowProductions.
