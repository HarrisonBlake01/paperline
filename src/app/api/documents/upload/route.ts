import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireWorkspace } from "@/lib/auth/workspace";
import { checkQuota } from "@/lib/auth/usage";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
  "image/png",
  "image/jpeg",
]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

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
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_type", mime: file.type },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: MAX_BYTES },
      { status: 413 },
    );
  }

  const folderId = (form.get("folder_id") as string | null) || null;

  const sb = createServiceClient();
  const bucket = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
  const id = randomUUID();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const storagePath = `${ctx.workspace.id}/${id}/${safeName}`;

  // Upload to Supabase Storage
  const arr = await file.arrayBuffer();
  const { error: upErr } = await sb.storage
    .from(bucket)
    .upload(storagePath, Buffer.from(arr), {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json(
      { error: "storage_upload_failed", detail: upErr.message },
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
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      status: "queued",
    })
    .select()
    .single();
  if (insErr) {
    return NextResponse.json(
      { error: "db_insert_failed", detail: insErr.message },
      { status: 500 },
    );
  }

  await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "document.uploaded",
    target_type: "document",
    target_id: id,
    metadata: { filename: file.name, size_bytes: file.size },
  });

  // Kick off processing asynchronously (fire-and-forget). When Inngest is
  // wired up, replace this with a typed event emit.
  void fetch(
    new URL(`/api/documents/${id}/process`, process.env.NEXT_PUBLIC_APP_URL).toString(),
    {
      method: "POST",
      headers: { "x-internal-trigger": "1" },
    },
  ).catch(() => {
    /* intentionally swallow — the document will stay queued and retry button can re-trigger */
  });

  return NextResponse.json({ document: doc });
}
