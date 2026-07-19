# Fable 5 prompt — Create the Paperline recruiter PowerPoint

Copy the full prompt below into a Fable 5 session with file/terminal access.

```text
You are Fable 5 acting as a senior technical storyteller, product-design lead, and presentation engineer. Create a polished, recruiter-ready PowerPoint presentation for Harrison Olvera's flagship portfolio project, Paperline.

This is an artifact-production task, not a writing exercise. Inspect the repository and supplied assets, create a real `.pptx`, render it for visual QA, revise visible problems, and deliver the verified PowerPoint plus a PDF preview and slide/contact-sheet preview.

PROJECT ROOT
/Users/openclaw-server/.openclaw/workspace/paperline/app

CANONICAL PORTFOLIO FOLDER
/Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio

PRIMARY AUDIENCE
A technical recruiter or hiring manager evaluating Harrison for Applied AI Engineer, Agentic AI Engineer, LLM Engineer, AI Automation Engineer, or full-stack AI roles.

PRESENTATION GOAL
Make a recruiter understand within 60 seconds that Harrison can:

1. Build a complete full-stack AI product rather than a toy chatbot.
2. Ground document outputs in page-level evidence and quoted source text.
3. Design deterministic controls around probabilistic model output.
4. Preserve human approval before consequential actions or spend.
5. Add an honest, deterministic evaluation harness.
6. Reason clearly about tenant boundaries, billing, durability, observability, and secure agent execution.
7. Separate working code, synthetic demonstration data, and future productionization paths without overclaiming.

NON-NEGOTIABLE CLAIMS RULE
Read this file first and treat it as the claims source of truth:

/Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/presentation-claims-audit.md

Do not include a claim unless it is supported by that audit, visible on the current site, or directly verified in repository source. If a claim is uncertain, omit it or label it as planned/demonstrated/synthetic.

REQUIRED SOURCE FILES TO INSPECT

- /Users/openclaw-server/.openclaw/workspace/paperline/app/README.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/SECURITY.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/README.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/case-study.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/architecture.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/interview-talking-points.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/screenshot-checklist.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/walkthrough-production-notes.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/evals/document-extraction/README.md
- /Users/openclaw-server/.openclaw/workspace/paperline/app/src/app/(app)/ops-agent/page.tsx
- /Users/openclaw-server/.openclaw/workspace/paperline/app/src/lib/ops-agent-demo.ts

LIVE PAGE TO INSPECT
https://paperline-xi.vercel.app/ops-agent

If browser access is available, inspect the live page and confirm its current labels before designing. Do not modify or deploy the site.

EXISTING MEDIA TO REUSE

- Main walkthrough video:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/paperline-ops-agent-walkthrough.mp4

- Hero screenshot:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/screenshots/01-ops-agent-hero.png

- Cited extraction and approvals:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/screenshots/02-cited-extraction-approvals.png

- Billing, trace, and secure-runtime direction:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/screenshots/03-billing-trace-security.png

- Full-page capture:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/screenshots/ops-agent-fullpage.png

- QA contact sheet:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/screenshots/walkthrough-contact-sheet.jpg

- Mermaid source architecture:
  /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/architecture.md

Keep the narrated walkthrough as a companion artifact, but do not place its long Google Drive URL on the final slide. The PowerPoint should stand alone.

OUTPUT FILES

Create:

1. /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/Paperline_Recruiter_Case_Study.pptx
2. /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/Paperline_Recruiter_Case_Study.pdf
3. /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/presentation-preview/contact-sheet.png
4. /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/presentation-preview/slide-01.png through the final slide preview
5. /Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/presentation-build-notes.md

Do not commit, push, deploy, publish, upload, apply to jobs, or contact anyone.

PRESENTATION FORMAT

- Widescreen 16:9.
- Target 9 core slides; maximum 10 core slides plus one optional appendix/source slide.
- Designed for a 6–8 minute recruiter or hiring-manager walkthrough.
- Every slide must also make sense when skimmed without narration.
- Use speaker notes with approximately 30–60 seconds of concise narration per slide.
- Keep body text short; no paragraph walls.
- Use visuals, callouts, and diagrams instead of duplicating the case-study document.
- Minimum readable font sizes: 28 pt for slide titles, 18 pt for body text, 14 pt only for source footnotes.
- Use proper slide masters/layouts rather than individually improvised coordinates when practical.
- Use native PowerPoint shapes/text when possible so the deck remains editable.

VISUAL DIRECTION

Match the live Paperline Ops Agent interface:

- Near-black/charcoal background.
- Slightly lighter graphite cards.
- White primary typography.
- Cool gray secondary text.
- Electric/cornflower blue accents.
- Green only for validated/implemented indicators.
- Amber only for approval-required/test-mode warnings.
- Thin low-contrast borders and restrained shadows.
- Modern technical-product aesthetic: calm, credible, premium, not “hacker,” neon cyberpunk, or generic AI-gradient art.

Preserve these visual strengths from the site:

- Strong oversized hero statement.
- Clear Upload → Extract → Approve → Operate workflow.
- Evidence cards with confidence, quote, and page citation.
- Human approval card with explicit owner/state.
- Distinct test-mode billing warning.
- Separate operator-trace and secure-runtime sections.

Simplify for slides:

- Remove the application sidebar unless showing a full-page product context shot.
- Crop screenshots tightly around the concept each slide explains.
- Do not shrink the full webpage into unreadable slide content.
- Use one primary idea per slide.
- Avoid decorative stock photos, robot imagery, fake dashboards, fabricated logos, and AI-generated customer scenes.
- Do not recolor screenshots in a way that hides status labels or citations.

RECOMMENDED SLIDE STORY

SLIDE 1 — TITLE / FLAGSHIP SIGNAL

Title:
Paperline

Subtitle:
Cited document intelligence with human-controlled operations

Supporting line:
Full-stack Applied AI portfolio case study · Harrison Olvera

Visual:
Use the hero screenshot as the primary visual, cropped to preserve the Paperline headline and operations-job card. Keep the title area clean; do not duplicate the full screenshot headline in both the image and slide text if it becomes visually repetitive.

Small credibility footer:
Next.js · TypeScript · Clerk · Supabase/pgvector · OpenAI · Stripe

Speaker-note goal:
Explain that Paperline addresses the gap between AI reading a document and a team safely acting on the result.

SLIDE 2 — THE PRODUCT PROBLEM

Headline:
Document AI needs evidence, structure, and control—not just plausible answers.

Use three concise problem cards:

- Evidence: Can the reviewer trace a field or answer to the source page?
- Structure: Can the output enter a repeatable workflow instead of remaining chat text?
- Control: Can the system prepare actions without silently spending or changing external systems?

Visual:
A clean three-part visual or cropped citation/detail fragments from the product. Do not use unverified market statistics.

Speaker-note goal:
Frame this as an engineering problem: mixed files, tenant boundaries, citations, schema validation, uncertainty, and approvals.

SLIDE 3 — END-TO-END WORKFLOW

Headline:
From upload to approval-ready operations

Visual centerpiece:
Upload → Extract → Approve → Operate

Use the exact live-demo quantities as synthetic-demo labels:

- 2 synthetic documents
- 4 cited fields
- 3 recommended actions
- Stripe test-mode preview

Add a visible label:
Synthetic recruiter demo — not a live customer workflow

Speaker-note goal:
Explain that the Ops Agent route compresses the product story into one reviewer-friendly surface.

SLIDE 4 — TRUSTWORTHY EXTRACTION

Headline:
Facts with receipts

Primary visual:
Use `02-cited-extraction-approvals.png`, cropped to emphasize at least two extraction cards and one approval card.

Callouts:

- Page-level document references
- Quoted source snippets
- Confidence shown as a review signal
- Human review flag for the auto-renewal clause

Critical caveat:
The displayed documents, values, and confidence labels are synthetic fixtures.

Speaker-note goal:
Discuss why evidence is part of the product interface rather than hidden in logs or a developer console.

SLIDE 5 — DETERMINISTIC CONTROLS AROUND AI

Headline:
The model extracts; the application controls.

Create a split layout:

Model-assisted:
- Classification
- Schema-guided extraction
- OCR-assisted processing
- Grounded answer generation

Deterministic application controls:
- Authentication and workspace authorization
- Runtime schema validation
- Storage and persistence
- Usage and billing rules
- Approval ownership/state

Use only items supported by the repository claims audit.

Speaker-note goal:
Show that Harrison understands where probabilistic model behavior should stop.

SLIDE 6 — SYSTEM ARCHITECTURE

Headline:
Full-stack document intelligence architecture

Render a presentation-friendly architecture diagram based on `architecture.md`. Do not paste raw Mermaid code into the slide.

The diagram must visually distinguish:

- Implemented: solid green or blue
- Synthetic demo: amber/dashed
- Planned productionization: gray/dotted

Include only the recruiter-relevant path:

Signed-in user → Next.js authenticated routes → workspace checks → private storage/database → parsing/OCR → chunks/embeddings/pgvector → extraction/cited chat → workflows/billing

Show the Ops Agent fixture and future paths separately so no viewer mistakes them for live integration.

Speaker-note goal:
Explain the data path, trust boundaries, and why service-role access still requires explicit workspace filters even with RLS-aware design.

SLIDE 7 — EVALUATION, NOT VIBES

Headline:
A deterministic extraction regression harness

Use a simple metric panel:

- 3 synthetic document cases
- 20 labeled fields
- 40.00% exact accuracy
- 75.00% normalized accuracy
- 94.12% presence F1
- 85.71% list-item F1

Prominent caveat:
Deliberately imperfect sample-prediction baseline used to validate the scorer—not live-model or production accuracy.

Add a small explanation:
Type-aware normalization handles casing/whitespace, currency/numbers, dates, booleans, and order-insensitive lists.

Visual:
A clean exact-vs-normalized comparison, not a fake performance benchmark chart against competitors.

Speaker-note goal:
Explain why exact matching can understate extraction quality and why presence/null behavior deserves a separate metric.

SLIDE 8 — APPROVALS, BILLING, AND SECURE-RUNTIME DIRECTION

Headline:
Agentic value without uncontrolled action

Use `03-billing-trace-security.png` as the main visual, cropped so these labels remain readable:

- Stripe test mode
- Waiting for human approval
- Hermes operator trace
- NVIDIA secure runtime path

Use three concise columns:

Demonstrated on the site:
- Visible action owners and states
- Stripe test-mode usage preview
- External spend/provisioning paused

Implemented elsewhere in the repository:
- Stripe Checkout/Portal routes
- Signature-verified subscription webhook
- Persisted workflow records

Validated architecture direction—not yet integrated:
- NVIDIA NemoClaw/OpenShell for a policy-governed Hermes sandbox
- controlled network access
- managed credential/inference handling

NVIDIA wording must remain exact and conservative:

> NVIDIA NemoClaw/OpenShell is a validated secure-runtime direction, not a completed Paperline integration.

Use a small source footnote:
NVIDIA/NemoClaw and NVIDIA/OpenShell official GitHub documentation, verified 2026-07-14.

Do not say NVIDIA secures the current Paperline deployment. Do not claim production audit traces, credential isolation, network enforcement, or compliance in Paperline today.

Speaker-note goal:
Explain that official NVIDIA documentation explicitly supports Hermes via NemoClaw, which makes the architecture direction credible, while Paperline has not wired that runtime yet.

SLIDE 9 — ENGINEERING TRADEOFFS AND NEXT STEPS

Headline:
What I would productionize next

Use four prioritized cards:

1. Durable execution
Move synchronous workflow execution to Inngest with idempotency, retries, resume, and dead-letter handling.

2. Persisted approvals
Add explicit approval policies and state transitions from proposed through completed/failed.

3. Evaluation expansion
Capture live predictions against a larger versioned, privacy-safe benchmark; add retrieval/citation evaluation.

4. Observability and isolation
Design safe Sentry/PostHog events and validate the NemoClaw/OpenShell path without logging document content.

Do not imply these are already complete.

Speaker-note goal:
Show maturity through explicit limitations and a practical production roadmap.

SLIDE 10 — RECRUITER CLOSE

Headline:
What Paperline demonstrates

Use five short proof statements:

- Full-stack AI product engineering
- Cited retrieval and schema-guided extraction
- Multi-tenant auth/data-boundary thinking
- Human-in-the-loop agent design
- Evaluation, billing, and productionization judgment

Add:
Harrison Olvera · Applied AI / Agentic AI / LLM Engineering

Include clean links:

- Live Ops Agent: https://paperline-xi.vercel.app/ops-agent
- GitHub: https://github.com/HarrisonBlake01/paperline

If generating QR codes, generate and scan/verify them before use. One QR maximum, preferably for the live Ops Agent page; keep the URLs as editable text.

Speaker-note goal:
Close on the engineering signal—not on hackathon branding or unsupported business outcomes.

OPTIONAL APPENDIX — CLAIMS/SOURCES

If needed, add one appendix slide with:

- Implemented repository paths
- Synthetic demo boundary
- Evaluation caveat
- NVIDIA official sources
- Statement that Paperline does not claim HIPAA, SOC 2, or legal certification

Keep this out of the main 6–8 minute flow unless asked.

SPEAKER NOTES

Add useful speaker notes to every slide. Notes should:

- Sound like Harrison speaking naturally in an interview.
- Avoid inflated seniority or “we” language that implies a team unless describing product architecture generally.
- Use “I built,” “I chose,” “I would,” and “the repository includes” when accurate.
- Explicitly label synthetic fixtures and planned integrations where first introduced.
- Avoid memorized marketing language.
- Never invent metrics or outcomes.

POWERPOINT CONSTRUCTION

Choose the most reliable available method, such as PptxGenJS, python-pptx, LibreOffice automation, or an existing presentation tool. Inspect installed tooling first rather than assuming.

Requirements:

- Use an editable theme and reusable slide layouts.
- Preserve image aspect ratios.
- Use proper crop modes; do not stretch screenshots.
- Add alt text to meaningful images when the chosen library supports it.
- Keep source URLs as clickable links.
- Keep output file size reasonable; prefer linking to the MP4 over embedding the entire video unless embedding can be done without making the deck unstable.
- Include slide numbers except on the title slide.
- Avoid animations that fail in PDF export.

VERIFICATION — REQUIRED BEFORE REPORTING COMPLETE

1. Validate the `.pptx` package opens and is structurally valid.
2. Confirm slide count is within the requested limit.
3. Extract slide text and check required labels are present.
4. Render every slide to PNG or PDF.
5. Build a contact sheet and inspect it visually.
6. Check for clipping, overflow, tiny text, awkward crops, low contrast, repeated content, broken characters, and inconsistent spacing.
7. Confirm all screenshots remain readable.
8. Confirm all hyperlinks and any QR code targets.
9. Confirm the NVIDIA slide says **validated architecture direction—not yet integrated**.
10. Confirm the evaluation slide says **sample baseline—not production accuracy**.
11. Confirm Stripe says **test mode** and spend is approval-gated.
12. Confirm no customer, revenue, compliance, production-model, or business-outcome claims were introduced.
13. Re-run or cite the already verified repository gates; do not claim new gate results without running them.
14. Write `presentation-build-notes.md` with:
    - tools used
    - slide count
    - output paths
    - fonts/theme choices
    - links included
    - verification commands/results
    - any remaining manual-review notes

FINAL RESPONSE FORMAT

Report:

- Exact PowerPoint path
- Exact PDF path
- Contact-sheet path
- Slide count
- Verification results
- Any caveats or recommended human review

Do not merely provide slide copy or a plan. Produce and verify the actual presentation files.
```

## Suggested Fable invocation

Use the configured Fable 5 model in a fresh Hermes session, then provide:

```text
Read and execute the full artifact-production prompt at:
/Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio/fable-5-powerpoint-prompt.md

Create and verify the actual PowerPoint, PDF, slide previews, and build notes. Do not deploy, publish, apply, contact anyone, or introduce claims not supported by the claims audit.
```
