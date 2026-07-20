import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth/workspace";
import { recordUsage } from "@/lib/auth/usage";
import { extractStructured } from "@/lib/ai/extract";
import { createServiceClient } from "@/lib/supabase/server";
import type { TemplateRow } from "@/lib/types";
import { enforceWorkspaceRateLimit } from "@/lib/security/rate-limit";
import { databaseIdSchema } from "@/lib/http/params";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  template_id: databaseIdSchema,
  document_ids: z.array(z.string().uuid()).min(1).max(25),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const rateLimited = await enforceWorkspaceRateLimit({
    workspaceId: ctx.workspace.id,
    action: "workflow_run",
    limit: 10,
    windowSeconds: 600,
  });
  if (rateLimited) return rateLimited;

  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: body.error.flatten() },
      { status: 400 },
    );
  }

  const sb = createServiceClient();
  const { data: tplRow } = await sb
    .from("templates")
    .select("*")
    .eq("id", body.data.template_id)
    .single();

  if (!tplRow) {
    return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  }

  const template = tplRow as TemplateRow;
  if (template.workspace_id && template.workspace_id !== ctx.workspace.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const uniqueDocumentIds = Array.from(new Set(body.data.document_ids));
  const { data: docs } = await sb
    .from("documents")
    .select("id,filename,text_content,status")
    .eq("workspace_id", ctx.workspace.id)
    .in("id", uniqueDocumentIds);

  const readyDocs = (docs ?? []).filter(
    (doc) => doc.status === "ready" && doc.text_content,
  );

  if (readyDocs.length !== uniqueDocumentIds.length) {
    return NextResponse.json(
      {
        error: "documents_not_ready",
        detail: "Every selected document must be processed and ready before a workflow can run.",
      },
      { status: 409 },
    );
  }

  const workflowName =
    body.data.name ??
    `${template.name} · ${new Date().toLocaleDateString("en-US")}`;

  const { data: workflow, error: workflowErr } = await sb
    .from("workflows")
    .insert({
      workspace_id: ctx.workspace.id,
      name: workflowName,
      template_id: template.id,
      status: "running",
      total_count: readyDocs.length,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (workflowErr || !workflow) {
    return NextResponse.json(
      { error: "workflow_create_failed" },
      { status: 500 },
    );
  }

  const { data: items, error: itemErr } = await sb
    .from("workflow_items")
    .insert(
      readyDocs.map((doc) => ({
        workflow_id: workflow.id,
        document_id: doc.id,
        status: "pending",
      })),
    )
    .select("id,document_id");

  if (itemErr || !items) {
    await sb
      .from("workflows")
      .update({ status: "failed", failed_count: readyDocs.length })
      .eq("id", workflow.id);
    return NextResponse.json(
      { error: "workflow_items_create_failed" },
      { status: 500 },
    );
  }

  let succeededCount = 0;
  let failedCount = 0;

  for (const item of items) {
    const doc = readyDocs.find((candidate) => candidate.id === item.document_id);
    if (!doc?.text_content) continue;

    await sb
      .from("workflow_items")
      .update({ status: "running" })
      .eq("id", item.id);

    const { data: extraction, error: extractionErr } = await sb
      .from("extractions")
      .insert({
        workspace_id: ctx.workspace.id,
        document_id: doc.id,
        template_id: template.id,
        status: "processing",
      })
      .select("id")
      .single();

    if (extractionErr || !extraction) {
      failedCount += 1;
      await sb
        .from("workflow_items")
        .update({
          status: "failed",
          error_message: "extraction_create_failed",
        })
        .eq("id", item.id);
      continue;
    }

    try {
      const run = await extractStructured({
        text: doc.text_content,
        schema: template.schema,
      });

      await sb
        .from("extractions")
        .update({
          status: "succeeded",
          result: run.result,
          model: run.model,
          prompt_tokens: run.promptTokens,
          completion_tokens: run.completionTokens,
          cost_cents: run.costCents,
        })
        .eq("id", extraction.id);

      await sb
        .from("workflow_items")
        .update({
          status: "succeeded",
          extraction_id: extraction.id,
          error_message: null,
        })
        .eq("id", item.id);

      await recordUsage({
        workspaceId: ctx.workspace.id,
        kind: "tokens",
        amount: run.promptTokens + run.completionTokens,
        costCents: run.costCents,
        referenceId: extraction.id,
      });

      succeededCount += 1;
    } catch (e) {
      failedCount += 1;
      await sb
        .from("extractions")
        .update({ status: "failed", error_message: "extraction_failed" })
        .eq("id", extraction.id);
      await sb
        .from("workflow_items")
        .update({
          status: "failed",
          extraction_id: extraction.id,
          error_message: "extraction_failed",
        })
        .eq("id", item.id);
      console.error("[workflows] extraction failed", {
        workflowId: workflow.id,
        documentId: doc.id,
        extractionId: extraction.id,
        errorType: e instanceof Error ? e.name : "UnknownError",
      });
    }
  }

  const finalStatus = failedCount > 0 ? "failed" : "completed";
  const { data: finished } = await sb
    .from("workflows")
    .update({
      status: finalStatus,
      succeeded_count: succeededCount,
      failed_count: failedCount,
    })
    .eq("id", workflow.id)
    .select()
    .single();

  await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "workflow.completed",
    target_type: "workflow",
    target_id: workflow.id,
    metadata: {
      template_id: template.id,
      total_count: readyDocs.length,
      succeeded_count: succeededCount,
      failed_count: failedCount,
    },
  });

  return NextResponse.json({ workflow: finished ?? workflow });
}
