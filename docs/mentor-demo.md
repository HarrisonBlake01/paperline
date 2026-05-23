# Paperline Mentor Demo Guide

This guide describes the intended demo path for a software developer manager/mentor reviewing Paperline before live deployment.

## Demo Goal

Show that Paperline is a polished, privacy-conscious document intelligence app for general users. The demo should feel closer to DocuSign or Dropbox than a developer tool.

## 30-Second Product Explanation

Paperline lets a user upload important documents, extract the details they care about, review the results, and reuse the same process as a workflow for future documents.

It is designed for sensitive documents, private workspace access, and verifiable results rather than casual AI summaries.

## Primary Demo Path

1. **Sign in**
   - Use Clerk authentication.
   - Land in the authenticated Paperline workspace.

2. **Upload a document**
   - Open the dashboard.
   - Upload a PDF, DOCX, TXT, PNG, or JPG.
   - Explain that documents are stored in workspace-scoped Supabase Storage.

3. **Review processing status**
   - Show queued/processing/ready states.
   - If processing fails, show the user-friendly failure guidance and retry path.

4. **Open the document**
   - Show the extracted text preview.
   - Show document status and metadata.
   - Emphasize that the app avoids exposing provider/model internals to general users.

5. **Run extraction**
   - Choose an extraction template.
   - Extract important details from the document.
   - Review the structured result.

6. **Create a workflow**
   - Open Workflows.
   - Select ready documents.
   - Select the template/details to save.
   - Run the workflow and show the completion status.

7. **Show repository/professional readiness**
   - README explains product, architecture, setup, and deployment.
   - SECURITY.md documents sensitive-document posture and compliance boundaries.
   - `.env.example` is present; real secrets are ignored.

## Demo Talking Points

- Built with Next.js 16, TypeScript, Tailwind v4, Clerk, Supabase, OpenAI, Stripe, and Vercel.
- General users are the first priority; developer API workflows come later.
- Workspace ownership checks prevent cross-user document access.
- Documents are treated as sensitive/private by default.
- The app avoids claiming formal HIPAA/SOC2 compliance before certification work is complete.
- Accessibility is considered through semantic pages, labels, keyboard-friendly controls, and visible states.

## Known Demo Limitations Before Live Deployment

- Formal HIPAA/SOC2 compliance has not been completed.
- Production background jobs should move from demo-friendly server triggers to a durable queue such as Inngest.
- More full-stack automated tests should be added before public launch.
- Production monitoring, retention/deletion flows, and incident response need final review.
- Developer/API positioning is intentionally secondary for this demo phase.

## Suggested Mentor Questions

Ask for feedback on:

- clarity of the document upload → extraction → workflow journey
- whether the app feels polished enough for a serious SaaS demo
- security/privacy expectations before deployment
- which workflow should be refined first for real users
- what belongs in the next post-demo milestone
