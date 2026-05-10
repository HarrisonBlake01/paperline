// =====================================================================
// Paperline — pricing plans (single source of truth)
// =====================================================================

export type PlanId = "free" | "pro" | "team" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // USD; 0 = free, -1 = contact us
  priceCents: number; // for Stripe
  pagesPerMonth: number; // -1 = unlimited
  seats: number; // -1 = unlimited
  customTemplates: boolean;
  aiTemplateGenerationsPerMonth: number; // -1 = unlimited
  integrations: boolean;
  apiAccess: boolean;
  sso: boolean;
  prioritySupport: boolean;
  prioritizedQueue: boolean;
  highlight?: boolean;
  description: string;
  features: string[];
  stripePriceEnv?: string; // env var name holding the Stripe price id
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceCents: 0,
    pagesPerMonth: 25,
    seats: 1,
    customTemplates: true,
    aiTemplateGenerationsPerMonth: 1,
    integrations: false,
    apiAccess: false,
    sso: false,
    prioritySupport: false,
    prioritizedQueue: false,
    description: "Try Paperline with a small monthly allowance.",
    features: [
      "25 pages / month",
      "1 user",
      "4 built-in templates (Invoice, Contract, Resume, Report)",
      "Community template library",
      "1 AI-generated custom template / month",
      "Document chat with citations",
      "Paperline branding on shared links",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    priceCents: 2900,
    pagesPerMonth: 1_000,
    seats: 3,
    customTemplates: true,
    aiTemplateGenerationsPerMonth: 25,
    integrations: true,
    apiAccess: false,
    sso: false,
    prioritySupport: true,
    prioritizedQueue: false,
    highlight: true,
    description: "For freelancers and small teams that handle real volume.",
    features: [
      "1,000 pages / month",
      "Up to 3 users",
      "Custom extraction templates",
      "Community template publishing + reuse",
      "25 AI-generated custom templates / month",
      "Google Drive, Dropbox, email-to-inbox",
      "Priority email support",
      "Remove Paperline branding",
    ],
    stripePriceEnv: "STRIPE_PRICE_PRO_MONTHLY",
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 99,
    priceCents: 9900,
    pagesPerMonth: 10_000,
    seats: -1,
    customTemplates: true,
    aiTemplateGenerationsPerMonth: 250,
    integrations: true,
    apiAccess: true,
    sso: true,
    prioritySupport: true,
    prioritizedQueue: true,
    description: "For companies running document workflows at scale.",
    features: [
      "10,000 pages / month",
      "Unlimited users",
      "API access + webhooks",
      "Community template publishing + reuse",
      "250 AI-generated custom templates / month",
      "Priority processing queue",
      "SSO (Google Workspace)",
      "Audit log export",
    ],
    stripePriceEnv: "STRIPE_PRICE_TEAM_MONTHLY",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: -1,
    priceCents: 0,
    pagesPerMonth: -1,
    seats: -1,
    customTemplates: true,
    aiTemplateGenerationsPerMonth: -1,
    integrations: true,
    apiAccess: true,
    sso: true,
    prioritySupport: true,
    prioritizedQueue: true,
    description: "Custom volume, dedicated support, security review.",
    features: [
      "Custom page volume",
      "Custom AI template generation volume",
      "Dedicated success manager",
      "DPA / MSA / security review",
      "Custom SSO + role mapping",
      "On-prem deployment available",
    ],
  },
};

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function isOverPageLimit(plan: Plan, pagesUsed: number): boolean {
  if (plan.pagesPerMonth === -1) return false;
  return pagesUsed >= plan.pagesPerMonth;
}
