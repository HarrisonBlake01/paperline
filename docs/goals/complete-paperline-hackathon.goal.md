/goal Complete the Paperline Ops Agent hackathon project end-to-end and deploy the final demo to Vercel.

You are continuing work in the Paperline project at:

`/Users/openclaw-server/.openclaw/workspace/paperline/app`

Live production URL to use and verify:

`https://paperline-xi.vercel.app/`

Primary demo route:

`/ops-agent`

Canonical project docs already present:

- `docs/hackathon-paperline-ops-agent.md`
- `docs/ops-agent-demo-script.md`
- `docs/ops-agent-job.sample.json`
- `docs/ops-agent-result.sample.json`

## Hackathon context

This is for the Hermes Agent Accelerated Business Hackathon presented by Nous Research, NVIDIA, and Stripe.

The project must clearly satisfy the hackathon theme: agents that can **earn, spend, and run real operations at scale**.

Paperline positioning:

> Paperline Ops Agent turns invoices, contracts, and business PDFs into cited answers, structured fields, approval workflows, Stripe test-mode billing/provisioning steps, and safe agent-run operations.

Do **not** position Paperline as generic “PDF chat.” The demo should be easy for a non-technical audience to understand as an AI back office for document-heavy businesses.

## Rules and guardrails

- Keep the demo simple and clear for judges/audience.
- Use a single polished workflow: invoice + contract bundle → cited extraction → recommended actions → human approval boundary → Stripe test-mode business operation → secure runtime story.
- Use Stripe **test mode** only unless Kurai explicitly approves real transactions.
- Do not spend money or perform purchases without explicit approval.
- Do not post tweets, submit Typeforms, or drop Discord submission links without explicit approval.
- Do not claim HIPAA, SOC 2, legal compliance, or real payment execution.
- Do not expose secrets, environment variables, tokens, document content, or private data in logs or screenshots.
- Keep simulated/sample data honest and clearly labeled.
- Keep Paperline polished, calm, privacy-conscious, and business-friendly.
- The NVIDIA angle should be framed as the enterprise secure-runtime path using NemoClaw/OpenShell: sandboxing, credential brokering, network policy, and auditable traces. Do not block project completion on a brittle full NemoClaw integration if it is not already available.

## Current known state

A polished `/ops-agent` route has already been built and deployed to Vercel. The route currently demonstrates:

- Hermes Agent operator
- Stripe test-mode operation
- NemoClaw/OpenShell secure path
- Northstar Supply Co. sample operations job
- invoice + contract bundle
- cited extraction fields
- recommended actions
- approval boundary
- Stripe test-mode usage preview
- Hermes operator trace
- NVIDIA secure runtime path

The production route has previously been deployed and verified at:

`https://paperline-xi.vercel.app/ops-agent`

However, you must re-verify current state before making claims.

## Objective

Finish the hackathon project so it is complete, understandable, and ready for recording/submission:

1. Audit the live `/ops-agent` route from a judge/audience perspective.
2. Polish anything that makes the story unclear, visually weak, or too technical.
3. Ensure the demo route explains the workflow in one obvious sequence:
   - business problem
   - uploaded documents / job context
   - cited facts / source evidence
   - recommended operations actions
   - approval before spend or external action
   - Stripe test-mode earning/billing/provisioning angle
   - Hermes Agent as operator
   - NVIDIA NemoClaw/OpenShell secure runtime path
4. Ensure supporting docs and fixtures match the UI and script.
5. Validate the app locally.
6. Deploy the completed project to Vercel production.
7. Verify the deployed production URL in browser and by HTTP checks.
8. Provide Kurai with the final URL, verification results, and any manual submission steps remaining.

## Implementation checklist

### 1. Load project context

- Read `AGENTS.md` if present in the repo.
- Read `docs/hackathon-paperline-ops-agent.md`.
- Read `docs/ops-agent-demo-script.md`.
- Inspect `src/app/(app)/ops-agent/page.tsx` and `src/lib/ops-agent-demo.ts`.
- Check `git status --short --branch`.

### 2. Audience-first QA

Open `/ops-agent` locally or production and assess:

- Is the headline understandable in 5 seconds?
- Can a judge tell what Paperline does without reading docs?
- Are Hermes, Stripe, and NVIDIA all visible and meaningful?
- Is “test mode” clear for Stripe?
- Is the human approval boundary visually obvious?
- Are citations/source evidence clearly visible?
- Is the final close line strong enough for the video?
- Does it avoid raw implementation jargon unless necessary?

Use browser automation and screenshots where helpful. Check console errors.

### 3. Polish if needed

Prefer small, high-impact changes. Good options:

- Add a compact “How the demo works” strip if the story is not obvious.
- Improve labels around Stripe test mode and approval gating.
- Add a clear “No spend without approval” callout if missing.
- Make the secure-runtime story short and concrete.
- Keep the layout responsive and video-readable.
- Avoid adding complex real integrations unless they directly improve the demo.

Do not overbuild.

### 4. Docs/fixtures alignment

Make sure these files agree with the UI and final demo story:

- `docs/hackathon-paperline-ops-agent.md`
- `docs/ops-agent-demo-script.md`
- `docs/ops-agent-job.sample.json`
- `docs/ops-agent-result.sample.json`
- `src/lib/ops-agent-demo.ts`

If the UI copy changes materially, update the script and fixtures to match.

### 5. Local verification

Run:

```bash
pnpm test:demo
pnpm lint
pnpm build
```

Then start local dev server if needed:

```bash
pnpm dev
```

Verify:

```bash
curl -I http://localhost:3000/ops-agent
```

Open local `/ops-agent` in the browser and check console output. No JS errors are acceptable.

### 6. Deploy to Vercel production

Deploy only after local checks pass:

```bash
vercel --prod --yes
```

Production alias should be:

`https://paperline-xi.vercel.app`

### 7. Production verification

After deploy, verify:

```bash
curl -I https://paperline-xi.vercel.app/ops-agent
vercel inspect <deployment-url> --logs
```

Then open:

`https://paperline-xi.vercel.app/ops-agent`

Check:

- page loads successfully
- `/ops-agent` returns 200
- no browser JS errors
- no obvious layout breakage
- route is video-ready

If the direct deployment URL is protected by Vercel SSO, verify the aliased production URL instead.

### 8. Final response to Kurai

Report concisely:

- final live URL
- what changed
- exact verification commands and results
- any warnings that matter, especially Clerk development key warnings if still present
- what manual steps remain:
  - record 1–3 minute demo video
  - tweet tagging `@NousResearch`
  - drop tweet link in submissions channel
  - fill Typeform

Do not claim the tweet/Discord/Typeform submission is done unless Kurai explicitly asked you to perform those external actions and you actually verified completion.

## Success criteria

The project is complete when:

- `/ops-agent` is polished, coherent, and understandable to a hackathon judge.
- The route clearly demonstrates document operations, citations, approvals, Stripe test-mode business operation, Hermes Agent, and NVIDIA NemoClaw/OpenShell security story.
- `pnpm test:demo`, `pnpm lint`, and `pnpm build` pass.
- Production deploy succeeds.
- `https://paperline-xi.vercel.app/ops-agent` returns 200 and loads in browser.
- Browser console has no JS errors.
- Final response gives Kurai the URL and remaining manual submission steps.
