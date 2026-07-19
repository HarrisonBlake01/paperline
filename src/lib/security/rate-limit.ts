import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface RateLimitOptions {
  workspaceId: string;
  action: string;
  limit: number;
  windowSeconds: number;
}

interface RateLimitRow {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

export async function enforceWorkspaceRateLimit(
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const sb = createServiceClient();
  const { data, error } = await sb.rpc("consume_workspace_rate_limit", {
    p_workspace_id: options.workspaceId,
    p_action: options.action,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] durable limiter unavailable", {
      action: options.action,
      workspaceId: options.workspaceId,
      errorCode: error.code,
    });
    return NextResponse.json(
      { error: "request_limit_unavailable" },
      { status: 503 },
    );
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
  if (!row) {
    return NextResponse.json(
      { error: "request_limit_unavailable" },
      { status: 503 },
    );
  }

  if (row.allowed) return null;

  const resetMs = Date.parse(row.reset_at);
  const retryAfter = Number.isFinite(resetMs)
    ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000))
    : options.windowSeconds;

  return NextResponse.json(
    { error: "rate_limit_exceeded", retry_after_seconds: retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(options.limit),
        "X-RateLimit-Remaining": String(Math.max(0, row.remaining)),
      },
    },
  );
}
