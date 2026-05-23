import { NextResponse } from "next/server";
import { processDocument } from "@/lib/pipeline";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const sb = createServiceClient();
  const { data: doc, error } = await sb
    .from("documents")
    .select("id")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    await processDocument({ documentId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[documents.process] failed", {
      documentId: id,
      workspaceId: ctx.workspace.id,
      detail: message,
    });
    return NextResponse.json(
      { ok: false, error: "processing_failed", detail: message },
      { status: 500 },
    );
  }
}
