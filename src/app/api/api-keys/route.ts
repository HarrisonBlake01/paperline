import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, requireWorkspace } from "@/lib/auth/workspace";
import { PLANS } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateBody = z.object({
  name: z.string().trim().min(1).max(80),
});

const DeleteBody = z.object({
  id: z.string().uuid(),
});

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function createApiKey() {
  return `pl_test_${randomBytes(32).toString("base64url")}`;
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!PLANS[ctx.workspace.plan].apiAccess) {
    return NextResponse.json(
      { error: "plan_required", detail: "API keys require the Team plan." },
      { status: 402 },
    );
  }

  const body = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: body.error.flatten() },
      { status: 400 },
    );
  }

  const apiKey = createApiKey();
  const prefix = apiKey.slice(0, 14);
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("api_keys")
    .insert({
      workspace_id: ctx.workspace.id,
      name: body.data.name,
      prefix,
      key_hash: hashApiKey(apiKey),
      created_by: ctx.userId,
    })
    .select("id,name,prefix,created_at,last_used_at,revoked_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "api_key_create_failed" },
      { status: 500 },
    );
  }

  await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "api_key.created",
    target_type: "api_key",
    target_id: data.id,
    metadata: { prefix },
  });

  return NextResponse.json({ api_key: apiKey, record: data });
}

export async function DELETE(req: Request) {
  let ctx;
  try {
    ctx = await requireWorkspace();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = DeleteBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: body.error.flatten() },
      { status: 400 },
    );
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.data.id)
    .eq("workspace_id", ctx.workspace.id)
    .is("revoked_at", null)
    .select("id,prefix")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "api_key_not_found" },
      { status: 404 },
    );
  }

  await sb.from("audit_logs").insert({
    workspace_id: ctx.workspace.id,
    actor_user_id: ctx.userId,
    action: "api_key.revoked",
    target_type: "api_key",
    target_id: data.id,
    metadata: { prefix: data.prefix },
  });

  return NextResponse.json({ ok: true });
}
