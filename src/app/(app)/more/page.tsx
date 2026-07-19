import Link from "next/link";
import {
  Bot,
  CreditCard,
  FileText,
  Globe2,
  Layers,
  MessageSquare,
  Plug,
  Settings,
  Workflow,
} from "lucide-react";

const destinations = [
  {
    href: "/ops-agent",
    label: "Ops Agent",
    description: "Hackathon demo for cited extraction, approvals, Stripe test mode, and safe Hermes operations.",
    icon: Bot,
  },
  {
    href: "/workflows",
    label: "Workflows",
    description: "Run extraction templates across batches of ready documents.",
    icon: Workflow,
  },
  {
    href: "/integrations",
    label: "Integrations",
    description: "Manage API keys and connected document sources.",
    icon: Plug,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Workspace details, members, and recent activity.",
    icon: Settings,
  },
  {
    href: "/settings/billing",
    label: "Billing",
    description: "Plan, page allowance, and template limits.",
    icon: CreditCard,
  },
  {
    href: "/templates/community",
    label: "Community templates",
    description: "Browse shared extraction schemas.",
    icon: Globe2,
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Review uploads and processing status.",
    icon: FileText,
  },
  {
    href: "/templates",
    label: "Templates",
    description: "Built-in, custom, and reusable extraction schemas.",
    icon: Layers,
  },
  {
    href: "/chats",
    label: "Chats",
    description: "Continue document conversations with citations.",
    icon: MessageSquare,
  },
];

export default function MorePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
        More
      </h1>
      <p className="mt-2 text-pl-fg-dim">
        All Paperline workspace areas in one place.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {destinations.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex gap-3 rounded-2xl border border-pl-border bg-pl-surface p-4 hover:bg-pl-surface-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pl-accent)]/12 text-[var(--pl-accent)]">
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <div className="font-medium">{label}</div>
              <p className="mt-1 text-sm text-pl-fg-dim">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
