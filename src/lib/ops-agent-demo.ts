export const opsAgentJob = {
  id: "ops-job-northstar-2026-06",
  workspace: "Northstar Supply Co.",
  status: "ready_for_review",
  submittedAt: "2026-06-18T15:42:00.000Z",
  documents: [
    {
      name: "Northstar-MSA-2026.pdf",
      type: "Master services agreement",
      pages: 18,
      status: "extracted",
    },
    {
      name: "INV-1048-Atlas-OCR.pdf",
      type: "Vendor invoice",
      pages: 2,
      status: "extracted",
    },
  ],
} as const;

export const extractedFields = [
  {
    label: "Invoice total",
    value: "$2,850.00",
    confidence: "98%",
    citation: "INV-1048-Atlas-OCR.pdf · p.1",
    quote: "Amount due: $2,850.00. Payment due by February 15, 2026.",
  },
  {
    label: "Payment due date",
    value: "Feb 15, 2026",
    confidence: "96%",
    citation: "INV-1048-Atlas-OCR.pdf · p.1",
    quote: "Net 30 payment terms apply to this invoice.",
  },
  {
    label: "Contract term",
    value: "12 months with auto-renewal",
    confidence: "93%",
    citation: "Northstar-MSA-2026.pdf · p.12",
    quote: "The initial term shall be twelve months and renew automatically unless cancelled 30 days before renewal.",
  },
  {
    label: "Human review flag",
    value: "Auto-renewal clause",
    confidence: "91%",
    citation: "Northstar-MSA-2026.pdf · p.12",
    quote: "Cancellation notice must be delivered no later than thirty days prior to the renewal date.",
  },
] as const;

export const recommendedActions = [
  {
    title: "Approve invoice for payment",
    owner: "Finance lead",
    state: "Approval required",
    detail:
      "Invoice is payable after human approval. Hermes will not initiate spend until approval is recorded.",
  },
  {
    title: "Create renewal reminder",
    owner: "Operations",
    state: "Ready to schedule",
    detail:
      "Set a reminder 45 days before renewal so the team has time to cancel or renegotiate.",
  },
  {
    title: "Ask vendor to clarify auto-renewal",
    owner: "Hermes draft",
    state: "Draft ready",
    detail:
      "Prepare a vendor email asking whether the clause can be changed to opt-in renewal.",
  },
] as const;

export const actionLog = [
  "Paperline received two documents and grouped them into one operations job.",
  "Extraction templates identified invoice fields, contract dates, and clause risks.",
  "Hermes generated an approval checklist and vendor follow-up draft.",
  "Stripe test-mode usage preview calculated 20 processed pages for the workspace.",
  "External spend/provisioning is paused until a human approves the action.",
] as const;

export const stripePreview = {
  mode: "Stripe test mode",
  customer: "Northstar Supply Co.",
  usage: "20 pages processed",
  estimatedCharge: "$6.00 usage preview",
  approvalState: "Waiting for human approval",
} as const;

export const securityStory = [
  "Hermes operates from cited Paperline extraction output instead of unbounded document access.",
  "NVIDIA NemoClaw/OpenShell is the planned enterprise runtime direction for sandboxing, credential brokering, and network policy.",
  "Every external action stays auditable and behind an approval boundary before spend or outbound changes.",
] as const;
