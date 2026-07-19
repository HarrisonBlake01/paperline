import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { processDocument } from "@/lib/pipeline";
import { requireWorkspace } from "@/lib/auth/workspace";
import { checkQuota } from "@/lib/auth/usage";
import { createServiceClient } from "@/lib/supabase/server";
import { enforceWorkspaceRateLimit } from "@/lib/security/rate-limit";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  sanitizeUploadFilename,
  validateUploadContent,
} from "@/lib/security/upload";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const OptionalFolderId = z.string().uuid().nullable();

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[documents.upload] workspace resolution failed", e);
    throw e;
  }

  const rateLimited = await enforceWorkspaceRateLimit({
    workspaceId: ctx.workspace.id,
    action: "document_upload",
    limit: 10,
    windowSeconds: 600,
  });
  if (rateLimited) return rateLimited;

  // Cheap upfront quota guard (real page count is known after parsing)
  const quota = checkQuota(ctx.workspace, 1);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "page_limit_reached",
        pagesUsed: quota.pagesUsed,
        pagesLimit: quota.pagesLimit,
      },
      { status: 402 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_type", mime: file.type },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: MAX_UPLOAD_BYTES },
      { status: 413 },
    );
  }

  const parsedFolderId = OptionalFolderId.safeParse(
    (form.get("folder_id") as string | null) || null,
  );
  if (!parsedFolderId.success) {
    return NextResponse.json({ error: "invalid_folder_id" }, { status: 400 });
  }
  const folderId = parsedFolderId.data;

  const sb = createServiceClient();
  if (folderId) {
    const { data: folder } = await sb
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("workspace_id", ctx.workspace.id)
      .maybeSingle();
    if (!folder) {
      return NextResponse.json({ error: "folder_not_found" }, { status: 404 });
    }
  }

  const bucket = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
  const id = randomUUID();
  const { displayName, storageName } = sanitizeUploadFilename(file.name);
  const storagePath = `${ctx.workspace.id}/${id}/${storageName}`;

  const arr = await file.arrayBuffer();
  const buffer = Buffer.from(arr);
  const contentError = validateUploadContent({
    declaredMime: file.type,
    buffer,
  });
  if (contentError) {
    const status = contentError === "file_too_large" ? 413 : 415;
    return NextResponse.json({ error: contentError }, { status });
  }

  // Upload to the private Supabase Storage bucket only after content checks.
  const { error: upErr } = await sb.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) {
    console.error("[documents.upload] storage upload failed", {
      bucket,
      storagePath,
      providerCode: upErr.name,
    });
    return NextResponse.json(
      { error: "storage_upload_failed" },
      { status: 500 },
    );
  }

  const { data: doc, error: insErr } = await sb
    .from("documents")
    .insert({
      id,
      workspace_id: ctx.workspace.id,
      folder_id: folderId,
      uploader_id: ctx.userId,
      filename: displayName,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      status: "queued",
    })
    .select()
    .single();
  if (insErr) {
    // Avoid leaving an orphaned private object if the metadata insert fails.
    await sb.storage.from(bucket).remove([storagePath]);
    console.error("[documents.upload] document insert failed", {
      workspaceId: ctx.workspace.id,
      userId: ctx.userId,
      storagePath,
      detail: insErr.message,
    });
    return NextResponse.json(
      { error: "db_insert_failed" },
      { status: 500 },
    );
  }

  const { error: auditErr } = await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "document.uploaded",
    target_type: "document",
    target_id: id,
    metadata: { filename: displayName, size_bytes: file.size },
  });
  if (auditErr) {
    console.error("[documents.upload] audit log insert failed", {
      workspaceId: ctx.workspace.id,
      userId: ctx.userId,
      detail: auditErr.message,
    });
  }

  // Process within the tracked request so serverless shutdown cannot abandon a
  // floating promise. A durable background queue remains the scale-up path.
  try {
    await processDocument({ documentId: id });
  } catch (error) {
    console.error("[documents.upload] processing completed with failure", {
      documentId: id,
      workspaceId: ctx.workspace.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
  }

  const { data: finalDocument } = await sb
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .single();

  return NextResponse.json(
    { document: finalDocument ?? doc },
    { status: 201 },
  );
}
