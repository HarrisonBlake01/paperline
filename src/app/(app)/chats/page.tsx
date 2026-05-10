import Link from "next/link";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const ctx = await getActiveWorkspace();
  if (!ctx) {
    return (
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <p className="text-pl-fg-dim">No workspace yet. Sign in to continue.</p>
      </main>
    );
  }

  const sb = createServiceClient();
  const { data: chats } = await sb
    .from("chats")
    .select("id, title, created_at")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
          Chats
        </h1>
        <Link
          href="/documents"
          className="rounded-lg border border-pl-border px-3 py-1.5 text-sm hover:bg-pl-surface"
        >
          Start from a document
        </Link>
      </div>

      {!chats?.length ? (
        <div className="mt-10 rounded-2xl border border-pl-border bg-pl-surface p-10 text-center text-pl-fg-dim">
          No chats yet. Open a document and click <em>Chat</em> to start one.
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-pl-border overflow-hidden rounded-2xl border border-pl-border bg-pl-surface">
          {chats.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chats/${c.id}`}
                className="block px-4 py-3 text-sm hover:bg-pl-surface-2"
              >
                <div className="font-medium">{c.title ?? "Untitled chat"}</div>
                <div className="font-mono text-xs text-pl-fg-dim">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
