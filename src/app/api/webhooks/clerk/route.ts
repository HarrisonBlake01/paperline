// =====================================================================
// Clerk webhook — provisions a personal workspace on user.created.
// =====================================================================

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { provisionPersonalWorkspace } from "@/lib/auth/provision";
import { sendWelcomeEmail } from "@/lib/email/send";

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

  let ctx;
  try {
    ctx = await provisionPersonalWorkspace(data.id);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json(
      { error: "provision_workspace_failed", detail },
      { status: 500 },
    );
  }

  if (!ctx) {
    return NextResponse.json({ error: "provision_workspace_failed" }, { status: 500 });
  }

  const email = data.email_addresses?.[0]?.email_address;
  if (ctx.created && email) {
    try {
      await sendWelcomeEmail({
        to: email,
        name: data.first_name ?? data.username ?? undefined,
      });
    } catch {
      // Do not fail signup provisioning if email send hiccups.
    }
  }

  return NextResponse.json({
    ok: true,
    workspace_id: ctx.workspace.id,
    created: ctx.created,
  });
}
