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

  const { data: template, error: readErr } = await sb
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .eq("is_builtin", false)
    .maybeSingle();

  if (readErr) throw readErr;
  if (!template) return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  const { data, error } = await sb
    .from("templates")
    .update({
      is_community: true,
      published_by: ctx.userId,
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .eq("is_builtin", false)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "template_publish_failed" },
      { status: 500 },
    );
  }

  await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "template.published",
    target_type: "template",
    target_id: data.id,
    metadata: { name: data.name, doc_type: data.doc_type },
  });

  return NextResponse.json({ template: data });
}
