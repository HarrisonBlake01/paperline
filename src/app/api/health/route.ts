import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json(
    {
      ok: true,
      service: "paperline",
      now: new Date().toISOString(),
      status: "alive",
      dependencies_checked: false,
      note: "Liveness only; this endpoint does not assert document-processing readiness.",
    },
    { status: 200 },
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
