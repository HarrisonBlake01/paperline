import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { ChatPanel, type ChatMessageView } from "@/components/chat-panel";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getActiveWorkspace();
  if (!ctx) notFound();
  const { id } = await params;

  const sb = createServiceClient();
  const { data: chat } = await sb
    .from("chats")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .single();
  if (!chat) notFound();

  const [{ data: docs }, { data: messages }] = await Promise.all([
    sb
      .from("chat_documents")
      .select("document_id, documents(id, filename)")
      .eq("chat_id", id),
    sb
      .from("chat_messages")
      .select("id, role, content, citations, created_at")
      .eq("chat_id", id)
      .order("created_at", { ascending: true }),
  ]);

  type ChatDocRow = {
    document_id: string;
    documents: { id: string; filename: string } | { id: string; filename: string }[] | null;
  };
  type ChatDocLink = {
    document_id: string;
    documents: { id: string; filename: string } | null;
  };
  const rawDocs = (docs ?? []) as unknown as ChatDocRow[];
  const documentLinks: ChatDocLink[] = rawDocs.map((d) => ({
    document_id: d.document_id,
    documents: Array.isArray(d.documents)
      ? d.documents[0] ?? null
      : d.documents,
  }));

  const initialMessages: ChatMessageView[] = (messages ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    citations: (m.citations ?? null) as ChatMessageView["citations"],
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight">
            {chat.title ?? "Chat"}
          </h1>
          <p className="mt-1 text-xs text-pl-fg-dim">
            {documentLinks.length === 1
              ? "Document: "
              : `Documents (${documentLinks.length}): `}
            {documentLinks.map((d, i) => (
              <span key={d.document_id}>
                {i > 0 ? ", " : ""}
                {d.documents ? (
                  <Link
                    href={`/documents/${d.documents.id}`}
                    className="hover:text-[var(--pl-accent)]"
                  >
                    {d.documents.filename}
                  </Link>
                ) : (
                  <span>unknown</span>
                )}
              </span>
            ))}
          </p>
        </div>
        <Link
          href="/chats"
          className="rounded-lg border border-pl-border px-3 py-1.5 text-sm hover:bg-pl-surface"
        >
          All chats
        </Link>
      </div>

      <div className="mt-6">
        <ChatPanel chatId={chat.id} initialMessages={initialMessages} />
      </div>
    </main>
  );
}
