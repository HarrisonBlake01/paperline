import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/auth/workspace";
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
  const { id } = await params;
  const sb = createServiceClient();

  const { data: template, error: readErr } = await sb
    .from("templates")
    .select("id, is_community, is_builtin, upvotes_count")
    .eq("id", id)
    .maybeSingle();

  if (readErr) throw readErr;
  if (!template) return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  if (!template.is_community && !template.is_builtin) {
    return NextResponse.json({ error: "not_community_template" }, { status: 403 });
  }

  const { data: existing } = await sb
    .from("template_votes")
    .select("template_id")
    .eq("template_id", id)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const nextCount = Math.max(0, (template.upvotes_count ?? 0) + (existing ? -1 : 1));

  if (existing) {
    await sb
      .from("template_votes")
      .delete()
      .eq("template_id", id)
      .eq("user_id", ctx.userId);
  } else {
    await sb.from("template_votes").insert({ template_id: id, user_id: ctx.userId });
  }

  const { data, error } = await sb
    .from("templates")
    .update({ upvotes_count: nextCount })
    .eq("id", id)
    .select("id, upvotes_count")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "template_vote_failed", detail: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ upvoted: !existing, upvotes_count: data.upvotes_count });
}
