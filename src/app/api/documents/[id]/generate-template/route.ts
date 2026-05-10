import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createServiceClient } from "@/lib/supabase/server";
import { recordUsage } from "@/lib/auth/usage";
import { generateTemplateFromDocument } from "@/lib/ai/template";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 120;

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

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
  const { id: documentId } = await params;

  const plan = getPlan(ctx.workspace.plan);
  if (!plan.customTemplates || plan.aiTemplateGenerationsPerMonth === 0) {
    return NextResponse.json(
      { error: "upgrade_required", detail: "AI-generated templates are not included on this plan." },
      { status: 402 },
    );
  }

  const sb = createServiceClient();

  if (plan.aiTemplateGenerationsPerMonth !== -1) {
    const { count, error: countErr } = await sb
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("action", "template.generated")
      .gte("created_at", monthStartIso());
    if (countErr) throw countErr;
    if ((count ?? 0) >= plan.aiTemplateGenerationsPerMonth) {
      return NextResponse.json(
        {
          error: "ai_template_limit_reached",
          detail: `This plan includes ${plan.aiTemplateGenerationsPerMonth} AI-generated template${plan.aiTemplateGenerationsPerMonth === 1 ? "" : "s"} per month.`,
        },
        { status: 429 },
      );
    }
  }

  const { data: doc } = await sb
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("workspace_id", ctx.workspace.id)
    .single();

  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (doc.status !== "ready" || !doc.text_content) {
    return NextResponse.json(
      { error: "not_ready", status: doc.status },
      { status: 409 },
    );
  }

  const generated = await generateTemplateFromDocument({
    filename: doc.filename,
    docType: doc.doc_type,
    text: doc.text_content,
  });

  const { data: template, error } = await sb
    .from("templates")
    .insert({
      workspace_id: ctx.workspace.id,
      name: generated.name,
      description: generated.description,
      doc_type: generated.docType,
      schema: generated.schema,
      is_builtin: false,
      created_by: ctx.userId,
    })
    .select("*")
    .single();

  if (error || !template) {
    return NextResponse.json(
      { error: "template_create_failed", detail: error?.message },
      { status: 500 },
    );
  }

  await Promise.all([
    recordUsage({
      workspaceId: ctx.workspace.id,
      kind: "tokens",
      amount: generated.promptTokens + generated.completionTokens,
      costCents: generated.costCents,
      referenceId: template.id,
    }),
    sb.from("audit_logs").insert({
      workspace_id: ctx.workspace.id,
      actor_user_id: ctx.userId,
      action: "template.generated",
      target_type: "template",
      target_id: template.id,
      metadata: {
        document_id: doc.id,
        model: generated.model,
        prompt_tokens: generated.promptTokens,
        completion_tokens: generated.completionTokens,
        cost_cents: generated.costCents,
      },
    }),
  ]);

  return NextResponse.json({ template });
}
