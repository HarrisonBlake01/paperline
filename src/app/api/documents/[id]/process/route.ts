import { NextResponse } from "next/server";
import { processDocument } from "@/lib/pipeline";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Allow either an authenticated user or our internal fire-and-forget trigger.
  const internal = req.headers.get("x-internal-trigger") === "1";
  console.log(`[documents.process] trigger id=${id} internal=${internal}`);
  if (!internal) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await processDocument({ documentId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[documents.process] failed id=${id} detail=${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
