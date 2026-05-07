// =====================================================================
// Clerk webhook — provisions a personal workspace on user.created.
// =====================================================================

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: { email_address: string }[];
    username?: string | null;
  };
}
type ClerkEvent = ClerkUserCreatedEvent | { type: string; data: unknown };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "workspace";
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "missing_secret" }, { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTs = h.get("svix-timestamp");
  const svixSig = h.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) {
    return NextResponse.json({ error: "missing_headers" }, { status: 400 });
  }

  const raw = await req.text();
  const wh = new Webhook(secret);
  let event: ClerkEvent;
  try {
    event = wh.verify(raw, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const data = (event as ClerkUserCreatedEvent).data;
  const sb = createServiceClient();

  // Skip if user already has a workspace
  const { data: existing } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", data.id)
    .limit(1);
  if (existing?.length) {
    return NextResponse.json({ ok: true, alreadyProvisioned: true });
  }

  const displayName =
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.username ||
    data.email_addresses?.[0]?.email_address?.split("@")[0] ||
    "Workspace";

  const baseSlug = slugify(displayName);
  let slug = baseSlug;
  for (let i = 0; i < 10; i++) {
    const { data: clash } = await sb
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: ws, error: wsErr } = await sb
    .from("workspaces")
    .insert({
      slug,
      name: `${displayName}'s workspace`,
      plan: "free",
      pages_limit: PLANS.free.pagesPerMonth,
    })
    .select()
    .single();
  if (wsErr || !ws) {
    return NextResponse.json(
      { error: "create_workspace_failed", detail: wsErr?.message },
      { status: 500 },
    );
  }

  const { error: memErr } = await sb.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: data.id,
    role: "owner",
  });
  if (memErr) {
    return NextResponse.json(
      { error: "create_member_failed", detail: memErr.message },
      { status: 500 },
    );
  }

  await sb.from("audit_logs").insert({
    workspace_id: ws.id,
    actor_user_id: data.id,
    action: "workspace.created",
    target_type: "workspace",
    target_id: ws.id,
    metadata: { source: "clerk.user.created" },
  });

  return NextResponse.json({ ok: true, workspace_id: ws.id });
}
