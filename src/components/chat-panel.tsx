"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface ChatCitationView {
  chunk_id: string;
  page: number | null;
  snippet: string;
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: ChatCitationView[] | null;
}

export function ChatPanel({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: ChatMessageView[];
}) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length, isSending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        role: "user",
        content: question,
        citations: null,
      },
    ]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: ChatMessageView;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !body.message) {
        toast.error("Chat failed", {
          description: body.detail ?? body.error ?? "Unknown error",
        });
        return;
      }
      setMessages((prev) => [...prev, body.message!]);
    } catch (err) {
      toast.error("Chat failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-pl-border bg-pl-surface">
      <div
        ref={scrollerRef}
        className="max-h-[60vh] min-h-[40vh] space-y-4 overflow-auto p-5"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-pl-fg-dim">
            Ask anything about the linked document. Answers cite the source
            chunks.
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {isSending ? (
          <div className="text-xs text-pl-fg-dim">Thinking…</div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-pl-border p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this document..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
            className="flex-1 resize-none rounded-lg border border-pl-border bg-pl-bg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--pl-accent)]"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-lg border border-pl-border bg-[var(--pl-accent)]/10 px-4 py-2 text-sm font-medium hover:bg-[var(--pl-accent)]/20 disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessageView }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "bg-[var(--pl-accent)]/15 text-pl-fg"
            : "bg-pl-surface-2 text-pl-fg/95"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.citations?.length ? (
          <details className="mt-3 border-t border-pl-border/60 pt-2 text-xs text-pl-fg-dim">
            <summary className="cursor-pointer select-none">
              Sources ({message.citations.length})
            </summary>
            <ol className="mt-2 space-y-2">
              {message.citations.map((c, i) => (
                <li key={c.chunk_id} className="rounded bg-pl-bg p-2">
                  <div className="font-mono text-[10px] text-pl-fg-dim">
                    [{i + 1}]{c.page ? ` · page ${c.page}` : ""}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-pl-fg/80">
                    {c.snippet}
                  </div>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </div>
  );
}
