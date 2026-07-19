import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { TemplateCreateInput, normalizeTemplateInput } from "@/lib/templates/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const parsed = TemplateCreateInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_template", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let normalized;
  try {
    normalized = normalizeTemplateInput(parsed.data);
  } catch {
    return NextResponse.json(
      { error: "invalid_template" },
      { status: 400 },
    );
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("templates")
    .insert({
      workspace_id: ctx.workspace.id,
      name: normalized.name,
      description: normalized.description,
      doc_type: normalized.doc_type,
      schema: normalized.schema,
      is_builtin: false,
      created_by: ctx.userId,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "template_create_failed" },
      { status: 500 },
    );
  }

  await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "template.created",
    target_type: "template",
    target_id: data.id,
    metadata: { name: data.name, doc_type: data.doc_type },
  });

  return NextResponse.json({ template: data });
}
