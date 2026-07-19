# Paperline recruiter deck — build notes

Built: 2026-07-16 · Machine: macOS (local) · Author: Hermes agent session for Harrison Olvera

## Output artifacts

| Artifact | Path |
|---|---|
| PowerPoint | `docs/portfolio/Paperline_Recruiter_Case_Study.pptx` (0.39 MB) |
| PDF preview | `docs/portfolio/Paperline_Recruiter_Case_Study.pdf` (0.78 MB) |
| Slide previews | `docs/portfolio/presentation-preview/slide-01.png` … `slide-11.png` (110 dpi, 1467×825) |
| Contact sheet | `docs/portfolio/presentation-preview/contact-sheet.png` |
| PowerPoint walkthrough video | `docs/portfolio/Paperline_PowerPoint_Walkthrough.mp4` (6.9 MB) |
| Video contact sheet | `docs/portfolio/presentation-preview/video-contact-sheet.jpg` |

Slide count: **11** — 10 core slides + 1 appendix (claims/sources), within the requested limit.

## Tools used

- **python-pptx 1.0.2** — deck construction with native editable shapes/text; generator script preserved at `docs/portfolio/scripts/build_deck.py`.
- **Pillow 12.2.0** — screenshot cropping (sidebar removal, concept-tight crops) and contact-sheet assembly.
- **LibreOffice 26.2.4** (installed via `brew install --cask libreoffice --appdir=~/Applications`) — headless `.pptx → .pdf` export. (Microsoft PowerPoint.app AppleScript export failed with sandbox errors ‑1712/‑9074; LibreOffice used instead.)
- **poppler/pdftoppm** — PDF → per-slide PNG rendering for visual QA.
- Visual QA: multimodal inspection of the contact sheet and individual slides; two revision rounds.

## Theme / fonts

- 16:9 widescreen (13.333 × 7.5 in), blank layout, per-slide programmatic layout.
- Palette matched to the live Ops Agent UI: background `#0B0D12`, cards `#151A24`/`#1B212E`, borders `#2A3140`, white `#F5F7FA`, gray `#9AA4B5`, blue accent `#5B8DEF`, green (implemented) `#3DC98E`, amber (caveats/test mode) `#F0B429`.
- Font: Helvetica Neue throughout (system-available; PDF export embeds Neue Helvetica).
- Font sizes: titles 30–54 pt, body ≥15 pt for content text; ≤14 pt reserved for footnotes/labels/diagram sublabels per the format rules (diagram node sublabels 10.5–12 pt, treated as footnote-class labels).
- Slide numbers on slides 2–11; none on the title slide.
- Alt text (`descr`) set on all four meaningful screenshots.
- No animations (PDF-safe). Walkthrough MP4 linked (Drive), not embedded, to keep the deck small/stable.

## Screenshot crops (Pillow, from `docs/portfolio/screenshots/`)

- `01-ops-agent-hero.png` → hero job card (slide 1), metric strip (slide 3). Sidebar removed.
- `02-cited-extraction-approvals.png` → extraction + approvals panels (slide 4).
- `03-billing-trace-security.png` → billing/trace/secure-runtime row (slide 8), centered.
- No recoloring; status labels and citations left untouched.

## Links included (slide 10, editable text + hyperlinks)

- Live Ops Agent: `https://paperline-xi.vercel.app/ops-agent`
- GitHub: `https://github.com/HarrisonBlake01/paperline`

No QR codes were generated (no verified QR tooling installed; prompt allows omitting).

## Verification results

1. **Package validity** — `zipfile.testzip()` on the `.pptx`: no bad entries; python-pptx re-opens it cleanly.
2. **Slide count** — 11 (10 core + appendix) ≤ limit. 16:9 confirmed (13.33 × 7.50 in).
3. **Required labels present** (programmatic text extraction):
   - “Synthetic recruiter demo — not a live customer workflow” (slide 3) ✔
   - “Displayed documents, values, and confidence labels are synthetic fixtures” (slide 4) ✔
   - “Sample-prediction baseline used to validate the scorer — not live-model or production accuracy” (slide 7) ✔
   - “NVIDIA NemoClaw/OpenShell is a validated secure-runtime direction, not a completed Paperline integration.” + source footnote “verified 2026-07-14” (slide 8) ✔
   - “VALIDATED PATH — NOT YET INTEGRATED” column (slide 8) ✔
   - Stripe **test mode** + “External spend/provisioning paused” (slides 1, 3, 8, 10) ✔
   - Eval metrics 40.00% / 75.00% / 94.12% / 85.71% with caveat ✔
   - Appendix HIPAA/SOC 2/legal disclaimer ✔
4. **Rendered QA** — all 11 slides rendered to PNG; contact sheet inspected visually. Two revision rounds fixed: slide 3/1/4/7 amber chip overflow, slide 4 callout title/description overlap, slide 6 legend crowding + node text overflow + a confusing cross-row arrow (removed), slide 8 image centering + third-column header overflow, slide 10 link color contrast. Final pass: no clipping, overlap, or unreadable text observed.
5. **Live page** — `https://paperline-xi.vercel.app/ops-agent` returned HTTP 200 on 2026-07-16; page text contains “verified operations”, “Stripe test mode”, “Waiting for human approval”, “operator trace”, “Secure runtime path”, “NemoClaw”, “OpenShell”, “$6.00”, “20 pages”, matching the deck’s labels.
6. **Hyperlink checks (2026-07-16)** — Ops Agent 200 ✔; GitHub repo URL returned **404 unauthenticated** (see caveats); Drive link returned **401 to curl** (Google auth wall; see caveats).
7. **Prohibited-claim scan** — no customer/revenue/uptime/compliance/production-accuracy claims. The only “revenue” match is the disclaimer “no customer, revenue, or compliance claims” (slide 10) and the appendix negative claim.
8. **Speaker notes** — present on all 11 slides, 30–60 s each, first-person (“I built / I would”), synthetic fixtures and planned integrations labeled at first mention.
9. **Repository gates** — not re-run in this session; the deck and appendix cite the gates already verified 2026-07-14 per `presentation-claims-audit.md` (`test:templates`, `test:extraction-eval`, `test:demo`, `lint`, `build`, `git diff --check`). No new gate results are claimed.

## Caveats / recommended human review

- **GitHub link**: `github.com/HarrisonBlake01/paperline` returns 404 to unauthenticated requests — the repo is likely private (or the slug differs). Before sharing the deck, either make the repo public/verify the slug or remove/replace the GitHub link on slide 10 and in the appendix footer.
- LibreOffice PDF export renders Helvetica Neue slightly differently from PowerPoint; if pixel-perfect PDF output matters, re-export the PDF from PowerPoint (File → Save As → PDF) after a quick visual check.
- Not committed/pushed/deployed anywhere, per instructions.

## PowerPoint walkthrough video correction (2026-07-16)

The desired walkthrough is a new video using the PowerPoint slides while preserving the narration from `paperline-ops-agent-walkthrough.mp4`. A corrected local video was created at `Paperline_PowerPoint_Walkthrough.mp4`.

- Original audio was transcribed locally with faster-whisper to align visuals to narration topics.
- Audio-aligned visual sequence: product problem (slide 2) → Paperline introduction (slide 1) → workflow (slide 3) → cited extraction/actions (slide 4) → approvals/billing/trace/NVIDIA direction (slide 8) → recruiter close (slide 10).
- Architecture, evaluation, and roadmap slides were omitted from this 2:14 video because the inherited narration never discusses them; displaying them would create an audio/visual mismatch.
- Video: H.264, 1920×1080, 30 fps; audio: original AAC mono 24 kHz stream copied without re-encoding.
- The copied audio stream is byte-identical by FFmpeg stream hash: `SHA256=40cdb5ce01008aaa8677a0cd605f177ef0d471579a975ba823d4ea3aeba831ea` for both the old and new videos.
- Visual QA contact sheet inspected: full-frame slides, no black frames, stretching, bad crops, or aspect-ratio distortion.
- The existing Google Drive URL still serves the **old** video. To make slide 10 point to the corrected walkthrough without changing the URL, upload `Paperline_PowerPoint_Walkthrough.mp4` as a new version of that existing Drive file (Drive → Manage versions → Upload new version). This external upload was not performed.

## Final-slide link correction (2026-07-17)

- Removed the narrated-walkthrough/Drive URL from slide 10 because its visible text was truncated.
- Slide 10 now contains only the complete Live Ops Agent and GitHub URLs.
- Updated slide 10 speaker notes to mention only those two links.
- Re-rendered the PowerPoint, PDF, all slide previews, and the walkthrough recording.
- The revised recording retains the original narration byte-for-byte and uses the corrected slide 10 for the closing segment.
- Durable generators now live at `docs/portfolio/scripts/build_deck.py` and `docs/portfolio/scripts/build-video.sh`.
