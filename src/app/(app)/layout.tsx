import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  FileText,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Plug,
  Settings,
  Workflow,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/templates", label: "Templates", icon: Layers },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr]">
      <aside className="border-r border-pl-border bg-pl-surface">
        <div className="flex items-center gap-2 px-5 py-5 font-[var(--font-display)] text-base font-semibold tracking-tight">
          <span className="inline-block h-4 w-4 rounded-sm border border-pl-fg/80" aria-hidden />
          paperline
        </div>
        <nav className="px-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-pl-fg-dim hover:bg-pl-surface-2 hover:text-pl-fg"
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between rounded-xl border border-pl-border bg-pl-bg px-3 py-2 text-sm">
            <UserButton />
            <span className="text-xs text-pl-fg-dim">Signed in</span>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
