import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { TemplateCreateInput, normalizeTemplateInput } from "@/lib/templates/validation";

export const runtime = "nodejs";

async function requireEditableTemplate(id: string) {
  const ctx = await requireWorkspace();
  const sb = createServiceClient();
  const { data: template, error } = await sb
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!template) {
    return { ctx, sb, response: NextResponse.json({ error: "template_not_found" }, { status: 404 }) };
  }
  if (template.is_builtin || template.workspace_id !== ctx.workspace.id) {
    return { ctx, sb, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ctx, sb, template, response: null };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let resource;
  try {
    const { id } = await params;
    resource = await requireEditableTemplate(id);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (resource.response) return resource.response;

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
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_template", detail: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }

  const { data, error } = await resource.sb
    .from("templates")
    .update({
      name: normalized.name,
      description: normalized.description,
      doc_type: normalized.doc_type,
      schema: normalized.schema,
    })
    .eq("id", resource.template.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "template_update_failed", detail: error?.message },
      { status: 500 },
    );
  }

  await resource.sb.from("audit_logs").insert({
    workspace_id: resource.ctx.workspace.id,
    actor_user_id: resource.ctx.userId,
    action: "template.updated",
    target_type: "template",
    target_id: data.id,
    metadata: { name: data.name, doc_type: data.doc_type },
  });

  return NextResponse.json({ template: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let resource;
  try {
    const { id } = await params;
    resource = await requireEditableTemplate(id);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (resource.response) return resource.response;

  const { error } = await resource.sb
    .from("templates")
    .delete()
    .eq("id", resource.template.id);

  if (error) {
    const isReferenced = error.message.toLowerCase().includes("foreign key");
    return NextResponse.json(
      {
        error: isReferenced ? "template_in_use" : "template_delete_failed",
        detail: isReferenced
          ? "This template has extraction history. Edit it instead, or keep it for audit history."
          : error.message,
      },
      { status: isReferenced ? 409 : 500 },
    );
  }

  await resource.sb.from("audit_logs").insert({
    workspace_id: resource.ctx.workspace.id,
    actor_user_id: resource.ctx.userId,
    action: "template.deleted",
    target_type: "template",
    target_id: resource.template.id,
    metadata: { name: resource.template.name, doc_type: resource.template.doc_type },
  });

  return NextResponse.json({ ok: true });
}
