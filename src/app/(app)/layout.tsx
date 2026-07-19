import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Bot,
  FileText,
  LayoutDashboard,
  Layers,
  Menu,
  MessageSquare,
  Plug,
  Settings,
  Workflow,
} from "lucide-react";
import { PaperlineMark } from "@/components/paperline-mark";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/ops-agent", label: "Ops Agent", icon: Bot },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/templates", label: "Templates", icon: Layers },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = NAV.filter(({ href }) =>
  ["/dashboard", "/documents", "/templates", "/chats"].includes(
    href,
  ),
).concat([{ href: "/more", label: "More", icon: Menu }]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[clamp(220px,22vw,260px)_1fr]">
      <aside className="sticky top-0 hidden h-screen min-w-0 flex-col overflow-hidden border-r border-pl-border bg-pl-surface lg:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-5 py-5 font-[var(--font-display)] text-xl font-semibold tracking-tight hover:opacity-90"
        >
          <PaperlineMark className="h-7 w-7 shrink-0 text-[var(--pl-accent)]" />
          <span className="truncate">paperline</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-pl-fg-dim hover:bg-pl-surface-2 hover:text-pl-fg"
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="shrink-0 p-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-pl-border bg-pl-bg px-3 py-2 text-sm">
            <UserButton />
            <span className="min-w-0 flex-1 truncate text-xs text-pl-fg-dim">
              Signed in
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-pl-border bg-pl-bg/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 font-[var(--font-display)] text-lg font-semibold tracking-tight"
          >
            <PaperlineMark className="h-6 w-6 shrink-0 text-[var(--pl-accent)]" />
            <span className="truncate">paperline</span>
          </Link>
          <UserButton />
        </header>

        {children}

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pl-border bg-pl-bg/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
            {MOBILE_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] text-pl-fg-dim hover:bg-pl-surface hover:text-pl-fg"
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
