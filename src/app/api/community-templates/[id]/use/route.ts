import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/auth/workspace";
import { parseUuidParam } from "@/lib/http/params";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
  const { id: rawId } = await params;
  const id = parseUuidParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "invalid_template_id" }, { status: 400 });
  }
  const sb = createServiceClient();

  const { data: source, error: readErr } = await sb
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readErr) throw readErr;
  if (!source) return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  if (!source.is_community && !source.is_builtin) {
    return NextResponse.json({ error: "not_community_template" }, { status: 403 });
  }

  const { data: copy, error: copyErr } = await sb
    .from("templates")
    .insert({
      workspace_id: ctx.workspace.id,
      name: source.name,
      description: source.description,
      doc_type: source.doc_type,
      schema: source.schema,
      is_builtin: false,
      is_community: false,
      source_template_id: source.id,
      created_by: ctx.userId,
    })
    .select("*")
    .single();

  if (copyErr || !copy) {
    return NextResponse.json(
      { error: "template_copy_failed" },
      { status: 500 },
    );
  }

  await Promise.all([
    sb
      .from("templates")
      .update({ uses_count: (source.uses_count ?? 0) + 1 })
      .eq("id", source.id),
    sb.from("audit_logs").insert({
      workspace_id: ctx.workspace.id,
      actor_user_id: ctx.userId,
      action: "template.community_used",
      target_type: "template",
      target_id: copy.id,
      metadata: { source_template_id: source.id, source_name: source.name },
    }),
  ]);

  return NextResponse.json({ template: copy });
}
