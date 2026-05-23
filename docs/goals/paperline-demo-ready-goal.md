# Paperline Demo-Ready Goal

## Mission

Continue development of Paperline from the existing codebase and make it demo-ready for mentor review before live deployment.

Local project path:

```text
/Users/openclaw-server/.openclaw/workspace/paperline/app
```

GitHub repository:

```text
https://github.com/HarrisonBlake01/paperline
```

Paperline is an AI document intelligence SaaS under ShadowProductions. It helps general users upload important documents, extract and save important data, and create reusable workflows/templates through a polished, simple business interface.

## Target State

Make Paperline feel credible, polished, secure, accessible, and cohesive enough to show to a software developer manager/mentor.

This is **demo-ready**, not full public production launch.

## Primary Audience

General users first:

- recruiters
- business users
- professionals handling important documents
- people who want to quickly find, extract, and save important information from documents

Developer-first features can exist, but they should not dominate the product experience yet. API-first/developer tailoring comes later.

## Product Feel

Paperline should feel like a DocuSign/Dropbox-style polished business tool:

- clean
- trustworthy
- simple
- calm
- professional
- secure
- accessible
- easy for non-technical users to understand

Avoid:

- overly technical language
- visible token/cost language
- cluttered dashboards
- developer-centric positioning
- experimental AI toy vibes
- confusing extraction/batch-processing terminology

## Locked Stack

Keep the existing stack choices:

- Next.js 16
- TypeScript
- Tailwind v4
- Clerk authentication
- Supabase/Postgres/pgvector/Storage
- OpenAI
- Stripe
- Vercel

## Primary Demo Journey

The most important flow is:

1. User signs in.
2. User uploads an important document.
3. App stores the document securely.
4. App parses/OCRs the document.
5. App extracts useful structured fields.
6. User reviews extracted data.
7. User saves or organizes the extracted information.
8. User creates or uses a workflow/template for repeatable document processing.
9. User sees a clear, polished dashboard-style experience that explains what happened and what to do next.

## Security, Privacy, and Accessibility Standard

Build toward strong privacy/security for sensitive documents, with HIPAA-like/legal-document-grade handling as a design standard, while avoiding false formal compliance claims.

Also align meaningfully with 508 accessibility expectations:

- semantic HTML
- keyboard navigability
- proper labels
- useful focus states
- sufficient contrast
- screen-reader-friendly status messages
- accessible forms
- accessible loading/error states

### Hard Security Expectations

- Never expose secrets to the client.
- Validate and authorize every document/workflow/API route server-side.
- Ensure users can only access their own documents, extraction results, workflows, templates, and API keys.
- Treat uploaded documents as sensitive private data.
- Avoid leaking document content in logs.
- Handle upload failures, extraction failures, and unauthorized access cleanly.
- Use least-privilege assumptions.
- Prefer secure defaults.
- Make privacy/security messaging visible enough for a mentor demo, without overclaiming formal compliance.

Safe phrasing examples:

- “Designed for sensitive documents”
- “Private by default”
- “Your documents stay in your workspace”
- “Access-controlled document processing”

Avoid claiming “HIPAA compliant” or “SOC2 compliant” unless actually implemented and verified.

## Existing Context

Previous work already included:

- mobile layout cleanup with desktop sidebar, mobile top bar, and bottom nav
- `/more` page for mobile navigation
- Workflows and Integrations pages
- `POST /api/workflows`
- API key management under Integrations
- `POST /api/api-keys`
- `DELETE /api/api-keys`
- removed customer-facing token/cost language
- improved failed-document UX with clearer explanations and retry guidance

Relevant recently modified files include:

- `src/app/(app)/more/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/proxy.ts`
- `src/app/(app)/workflows/page.tsx`
- `src/app/api/workflows/route.ts`
- `src/components/workflows/create-workflow-form.tsx`
- `src/app/(app)/integrations/page.tsx`
- `src/app/api/api-keys/route.ts`
- `src/components/integrations/api-keys-panel.tsx`
- `src/app/api/documents/[id]/extract/route.ts`

## Development Approach

Before implementing, inspect the current codebase and git state. Do not assume memory is accurate. Verify:

- package scripts
- routes
- components
- database/server utilities
- auth patterns
- upload/extraction implementation
- workflow implementation
- existing tests/lint/build status

Then create and execute a focused demo-readiness plan.

## Priorities

### Priority 1: Make the Primary User Journey Coherent

The app should clearly support:

- document upload
- processing/parsing status
- extraction results
- review/save state
- workflow/template creation
- workflow/template usage or a convincing demo-ready path toward usage

If something is partially implemented, finish the user-facing path first. If a backend piece is missing and too large for demo scope, implement a safe, honest, demo-ready version that does not fake security-critical behavior.

### Priority 2: Simplify and Polish General-User UX

Review visible language and UI in the main app flow. Rewrite anything that sounds developer-first or infrastructure-heavy.

Use language like:

- “Upload documents”
- “Extract important details”
- “Review results”
- “Save as a workflow”
- “Reuse this workflow”
- “Processing”
- “Needs review”
- “Ready”

Avoid language like:

- tokens
- embeddings
- pgvector
- JSON schema unless hidden behind advanced UI
- API-first messaging
- batch pipelines unless explained simply
- raw model/provider details

### Priority 3: Strengthen Privacy/Security Posture

Audit routes and server actions involved in:

- documents
- uploads
- extraction
- workflows
- templates
- integrations/API keys

Check for:

- missing auth
- missing ownership checks
- unsafe direct object access
- sensitive logs
- overly broad database queries
- client-exposed secrets
- poor error messages
- insecure file handling assumptions

Fix critical issues before adding polish.

### Priority 4: Accessibility and Mentor-Demo Readiness

Audit main pages and components for:

- labels
- aria attributes where needed
- keyboard navigation
- visible focus
- color contrast
- heading structure
- loading states
- empty states
- error states
- mobile usability

The mentor demo should not break if:

- no documents exist
- upload fails
- extraction fails
- user has no workflows
- user is on mobile
- document is still processing

### Priority 5: Demo Data and Guided Experience

If appropriate, add safe demo-friendly affordances:

- helpful empty states
- sample workflow copy
- clearer onboarding text
- “Create your first workflow” CTA
- “Upload your first document” CTA
- status badges
- simple explanation panels
- privacy reassurance copy

## GitHub and Repository Readiness

Before finishing the demo-ready goal, make the GitHub repository look professional and safe for a software developer manager/mentor to review.

GitHub authentication has been verified for `HarrisonBlake01`. Use the token carefully without printing or committing token values.

Important current repo state:

- The local Paperline repository has the real app history.
- The GitHub remote currently has an unrelated initial commit containing only a README.
- Before pushing final work, reconcile this deliberately and safely.

Required repo tasks:

1. Inspect local git status, branch, remotes, and remote history.
2. Confirm there are no committed secrets:
   - no `.env`
   - no `.env.local`
   - no API keys
   - no service-role keys
   - no tokens
   - no private credentials
3. Keep `.env.example` committed and professional.
4. Make sure `.gitignore` protects local secrets and build artifacts.
5. Make the repo presentation mentor-ready:
   - clear `README.md`
   - professional project description
   - local setup instructions
   - tech stack
   - architecture overview
   - security/privacy notes
   - demo workflow notes
6. Rename package metadata if appropriate so `package.json` uses a professional project name such as `"paperline"` instead of `"app"`.
7. Add a `SECURITY.md` describing:
   - sensitive document handling posture
   - no committed secrets policy
   - responsible disclosure/contact placeholder
   - clear statement that formal HIPAA/SOC2 compliance is not yet claimed unless actually implemented
8. Add a short mentor/demo document if useful, such as `docs/mentor-demo.md`, including:
   - intended demo path: upload document → extraction/review → workflow
   - known demo limitations before production launch
9. Run quality checks before committing:
   - `pnpm lint`
   - `pnpm build`
   - any available tests, including `pnpm test:templates` if relevant
10. Commit changes with clean, professional commit messages.
11. Before pushing, handle the unrelated remote history deliberately:
   - inspect remote `origin/main`
   - preserve any useful remote README content if needed
   - then either merge with `--allow-unrelated-histories` if preserving remote history is desired, or replace the remote with the local app history if the remote README is just placeholder content
12. Push only after confirming:
   - build passes
   - lint passes
   - no secrets are tracked
   - README/security/demo docs look professional
   - git history and branch state are clean

## Quality Gates

Before declaring the goal complete, run and pass:

```bash
pnpm lint
pnpm build
pnpm test:templates
```

Also manually inspect the key pages/routes in code for broken links, missing imports, and inconsistent UX.

## Definition of Done

Paperline is demo-ready when:

1. A mentor can understand what the product does within 30 seconds.
2. The document upload → extraction/review → workflow path is coherent and polished.
3. The app feels like a serious DocuSign/Dropbox-style business SaaS, not a developer tool.
4. General users are prioritized over developers.
5. Sensitive document handling is visibly and technically treated with care.
6. Main routes have server-side auth and ownership checks where needed.
7. Errors, empty states, and loading states are clear and non-technical.
8. The app is meaningfully accessible and keyboard/screen-reader friendly.
9. Mobile and desktop layouts both feel intentional.
10. `pnpm lint`, `pnpm build`, and `pnpm test:templates` pass.
11. Any remaining limitations are documented clearly as mentor-demo limitations, not hidden.
12. The GitHub repository is professional, clean, secret-free, and ready for a software developer manager/mentor to view.

## Final Output Expected

When finished, provide:

- concise summary of what changed
- files modified
- security/privacy improvements made
- accessibility improvements made
- exact verification commands run and their results
- GitHub push/repo status
- remaining limitations before live deployment
- recommended next steps after mentor feedback
