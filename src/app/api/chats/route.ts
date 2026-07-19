import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({
  document_id: z.string().uuid().optional(),
  document_ids: z.array(z.string().uuid()).optional(),
  title: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const docIds = parsed.data.document_ids ??
    (parsed.data.document_id ? [parsed.data.document_id] : []);
  if (!docIds.length) {
    return NextResponse.json({ error: "no_documents" }, { status: 400 });
  }

  const sb = createServiceClient();

  // Verify all docs belong to this workspace and are ready
  const { data: docs, error: docErr } = await sb
    .from("documents")
    .select("id, filename, status")
    .in("id", docIds)
    .eq("workspace_id", ctx.workspace.id);
  if (docErr) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if ((docs?.length ?? 0) !== docIds.length) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  }
  const notReady = docs!.filter((d) => d.status !== "ready");
  if (notReady.length) {
    return NextResponse.json(
      {
        error: "documents_not_ready",
        ids: notReady.map((d) => d.id),
      },
      { status: 409 },
    );
  }

  const title =
    parsed.data.title ??
    (docs!.length === 1 ? docs![0].filename : `Chat with ${docs!.length} docs`);

  const { data: chat, error: chatErr } = await sb
    .from("chats")
    .insert({
      workspace_id: ctx.workspace.id,
      title,
      created_by: ctx.userId,
    })
    .select()
    .single();
  if (chatErr || !chat) {
    return NextResponse.json(
      { error: "create_failed" },
      { status: 500 },
    );
  }

  const { error: linkErr } = await sb.from("chat_documents").insert(
    docIds.map((document_id) => ({ chat_id: chat.id, document_id })),
  );
  if (linkErr) {
    await sb.from("chats").delete().eq("id", chat.id);
    return NextResponse.json(
      { error: "link_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ chat });
}
