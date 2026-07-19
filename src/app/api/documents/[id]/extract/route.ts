import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth/workspace";
import { parseUuidParam } from "@/lib/http/params";
import { createServiceClient } from "@/lib/supabase/server";
import { extractStructured } from "@/lib/ai/extract";
import { recordUsage } from "@/lib/auth/usage";
import { enforceWorkspaceRateLimit } from "@/lib/security/rate-limit";
import type { TemplateRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  template_id: z.string().uuid(),
});

export async function POST(
  req: Request,
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
    action: "document_extract",
    limit: 30,
    windowSeconds: 600,
  });
  if (rateLimited) return rateLimited;

  const { id: rawDocumentId } = await params;
  const documentId = parseUuidParam(rawDocumentId);
  if (!documentId) {
    return NextResponse.json({ error: "invalid_document_id" }, { status: 400 });
  }

  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: body.error.flatten() },
      { status: 400 },
    );
  }

  const sb = createServiceClient();

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

  const { data: tplRow } = await sb
    .from("templates")
    .select("*")
    .eq("id", body.data.template_id)
    .single();
  if (!tplRow) return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  const tpl = tplRow as TemplateRow;
  if (tpl.workspace_id && tpl.workspace_id !== ctx.workspace.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Create extraction row
  const { data: extInsert, error: insErr } = await sb
    .from("extractions")
    .insert({
      workspace_id: ctx.workspace.id,
      document_id: doc.id,
      template_id: tpl.id,
      status: "processing",
    })
    .select()
    .single();
  if (insErr || !extInsert) {
    return NextResponse.json(
      { error: "db_insert_failed" },
      { status: 500 },
    );
  }

  try {
    const run = await extractStructured({
      text: doc.text_content,
      schema: tpl.schema,
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
      .eq("id", extInsert.id);

    await recordUsage({
      workspaceId: ctx.workspace.id,
      kind: "tokens",
      amount: run.promptTokens + run.completionTokens,
      costCents: run.costCents,
      referenceId: extInsert.id,
    });

    return NextResponse.json({
      extraction_id: extInsert.id,
      result: run.result,
    });
  } catch (e) {
    await sb
      .from("extractions")
      .update({ status: "failed", error_message: "extraction_failed" })
      .eq("id", extInsert.id);
    console.error("[documents.extract] extraction failed", {
      documentId,
      workspaceId: ctx.workspace.id,
      extractionId: extInsert.id,
      errorType: e instanceof Error ? e.name : "UnknownError",
    });
    return NextResponse.json({ error: "extraction_failed" }, { status: 500 });
  }
}
