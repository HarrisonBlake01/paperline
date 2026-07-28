import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth/workspace";
import { parseUuidParam } from "@/lib/http/params";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DeleteDocumentBody = z.object({
  operationToken: z.string().uuid(),
});

async function pauseDocumentDeletion(
  sb: ReturnType<typeof createServiceClient>,
  workspaceId: string,
  documentId: string,
  operationToken: string,
) {
  await sb.rpc("pause_document_deletion", {
    p_workspace_id: workspaceId,
    p_document_id: documentId,
    p_operation_token: operationToken,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  const { id: rawId } = await params;
  const id = parseUuidParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "invalid_document_id" }, { status: 400 });
  }

  const body = DeleteDocumentBody.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const operationToken = body.data.operationToken;

  const sb = createServiceClient();
  const { data: document, error: documentError } = await sb
    .from("documents")
    .select("id,storage_path")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();

  if (documentError) throw documentError;
  if (!document) {
    // A dropped success response is safe to replay: the content-free audit event
    // proves this exact logical operation already finalized the document.
    const { data: completed } = await sb
      .from("audit_logs")
      .select("id")
      .eq("workspace_id", ctx.workspace.id)
      .eq("action", "document.deleted")
      .eq("target_id", id)
      .contains("metadata", { operation_token: operationToken })
      .maybeSingle();
    if (completed) return NextResponse.json({ ok: true, replayed: true });
    return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  }

  const { data: claimed, error: claimError } = await sb.rpc(
    "claim_document_deletion",
    {
      p_workspace_id: ctx.workspace.id,
      p_document_id: document.id,
      p_operation_token: operationToken,
    },
  );
  if (claimError) {
    console.error("[documents.delete] lifecycle claim failed", {
      documentId: document.id,
      workspaceId: ctx.workspace.id,
      errorType: claimError.code ?? "DatabaseError",
    });
    return NextResponse.json(
      { error: "document_delete_unavailable" },
      { status: 503 },
    );
  }
  if (claimed !== true) {
    return NextResponse.json(
      { error: "document_operation_in_progress" },
      { status: 409 },
    );
  }

  const bucket = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
  const { error: storageError } = await sb.storage
    .from(bucket)
    .remove([document.storage_path]);
  if (storageError) {
    console.error("[documents.delete] storage removal failed", {
      documentId: document.id,
      workspaceId: ctx.workspace.id,
      providerCode: storageError.name,
    });
    await pauseDocumentDeletion(
      sb,
      ctx.workspace.id,
      document.id,
      operationToken,
    ).catch(() => undefined);
    return NextResponse.json(
      { error: "document_delete_unavailable" },
      { status: 503 },
    );
  }

  const { data: finalized, error: finalizeError } = await sb.rpc(
    "finalize_document_deletion",
    {
      p_workspace_id: ctx.workspace.id,
      p_document_id: document.id,
      p_operation_token: operationToken,
      p_actor_user_id: ctx.userId,
    },
  );
  if (finalizeError || finalized !== true) {
    console.error("[documents.delete] relational finalization failed", {
      documentId: document.id,
      workspaceId: ctx.workspace.id,
      errorType: finalizeError?.code ?? "DocumentOperationLost",
    });
    await pauseDocumentDeletion(
      sb,
      ctx.workspace.id,
      document.id,
      operationToken,
    ).catch(() => undefined);
    return NextResponse.json(
      { error: "document_delete_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
