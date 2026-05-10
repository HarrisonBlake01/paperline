import { NextResponse } from "next/server";
import { checkEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = checkEnv();
  return NextResponse.json(
    {
      ok: env.ok,
      service: "paperline",
      now: new Date().toISOString(),
      env_missing: env.ok ? [] : env.missing,
    },
    { status: env.ok ? 200 : 503 },
  );
}
