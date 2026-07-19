import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth/workspace";
import { parseUuidParam } from "@/lib/http/params";
import { createServiceClient } from "@/lib/supabase/server";
import { chatWithDocuments } from "@/lib/ai/chat";
import { recordUsage } from "@/lib/auth/usage";
import { enforceWorkspaceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  question: z.string().min(1).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const rateLimited = await enforceWorkspaceRateLimit({
    workspaceId: ctx.workspace.id,
    action: "chat_message",
    limit: 60,
    windowSeconds: 600,
  });
  if (rateLimited) return rateLimited;

  const { id: rawChatId } = await params;
  const chatId = parseUuidParam(rawChatId);
  if (!chatId) {
    return NextResponse.json({ error: "invalid_chat_id" }, { status: 400 });
  }
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const sb = createServiceClient();

  const { data: chat } = await sb
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .eq("workspace_id", ctx.workspace.id)
    .single();
  if (!chat) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: chatDocs } = await sb
    .from("chat_documents")
    .select("document_id")
    .eq("chat_id", chatId);
  const docIds = (chatDocs ?? []).map((d) => d.document_id);
  if (docIds.length === 0) {
    return NextResponse.json({ error: "no_documents_in_chat" }, { status: 400 });
  }

  const { data: history } = await sb
    .from("chat_messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Persist the user message
  await sb.from("chat_messages").insert({
    chat_id: chatId,
    role: "user",
    content: body.data.question,
  });

  try {
    const result = await chatWithDocuments({
      workspaceId: ctx.workspace.id,
      documentIds: docIds,
      question: body.data.question,
      history: (history ?? []).filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          m.role === "user" || m.role === "assistant",
      ),
    });

    const { data: assistantMsg } = await sb
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        role: "assistant",
        content: result.answer,
        citations: result.citations,
      })
      .select()
      .single();

    await recordUsage({
      workspaceId: ctx.workspace.id,
      kind: "tokens",
      amount: result.promptTokens + result.completionTokens,
    });

    return NextResponse.json({ message: assistantMsg });
  } catch (e) {
    console.error("[chats.messages] chat completion failed", {
      chatId,
      workspaceId: ctx.workspace.id,
      errorType: e instanceof Error ? e.name : "UnknownError",
    });
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
