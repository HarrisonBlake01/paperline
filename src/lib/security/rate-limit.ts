import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export interface RateLimitOptions {
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

export type WorkspaceRateLimitResult =
  | { status: "allowed"; remaining: number; resetAt: string }
  | { status: "limited"; remaining: 0; resetAt: string; retryAfterSeconds: number }
  | { status: "unavailable" };

export async function consumeWorkspaceRateLimit(
  options: RateLimitOptions,
): Promise<WorkspaceRateLimitResult> {
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
    return { status: "unavailable" };
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
  if (!row) return { status: "unavailable" };

  if (row.allowed) {
    return {
      status: "allowed",
      remaining: Math.max(0, row.remaining),
      resetAt: row.reset_at,
    };
  }

  const resetMs = Date.parse(row.reset_at);
  const retryAfterSeconds = Number.isFinite(resetMs)
    ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000))
    : options.windowSeconds;
  return {
    status: "limited",
    remaining: 0,
    resetAt: row.reset_at,
    retryAfterSeconds,
  };
}

export async function enforceWorkspaceRateLimit(
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const result = await consumeWorkspaceRateLimit(options);
  if (result.status === "unavailable") {
    return NextResponse.json(
      { error: "request_limit_unavailable" },
      { status: 503 },
    );
  }
  if (result.status === "allowed") return null;

  return NextResponse.json(
    {
      error: "rate_limit_exceeded",
      retry_after_seconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(options.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
