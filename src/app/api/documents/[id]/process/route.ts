import { NextResponse } from "next/server";
import { DocumentProcessConflictError, processDocument } from "@/lib/pipeline";
import { requireWorkspace } from "@/lib/auth/workspace";
import { parseUuidParam } from "@/lib/http/params";
import { createServiceClient } from "@/lib/supabase/server";
import { enforceWorkspaceRateLimit } from "@/lib/security/rate-limit";

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

  const rateLimited = await enforceWorkspaceRateLimit({
    workspaceId: ctx.workspace.id,
    action: "document_process",
    limit: 10,
    windowSeconds: 600,
  });
  if (rateLimited) return rateLimited;

  const { id: rawId } = await params;
  const id = parseUuidParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "invalid_document_id" }, { status: 400 });
  }
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
    if (e instanceof DocumentProcessConflictError) {
      return NextResponse.json(
        { ok: false, error: "document_not_processable" },
        { status: 409 },
      );
    }
    console.error("[documents.process] failed", {
      documentId: id,
      workspaceId: ctx.workspace.id,
      errorType: e instanceof Error ? e.name : "UnknownError",
    });
    return NextResponse.json(
      { ok: false, error: "processing_failed" },
      { status: 500 },
    );
  }
}
