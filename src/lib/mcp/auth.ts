import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import type { Role } from "@/lib/types";

export const AGENT_SCOPES = [
  "documents:read",
  "templates:read",
  "extractions:read",
  "extractions:write",
] as const;

export type AgentScope = (typeof AGENT_SCOPES)[number];

export interface McpPrincipal {
  credentialId: string;
  workspaceId: string;
  userId: string;
  role: Role;
  scopes: ReadonlySet<AgentScope>;
}

export type McpAuthenticationResult =
  | { ok: true; principal: McpPrincipal }
  | { ok: false; status: 401; error: "invalid_agent_credential" }
  | { ok: false; status: 503; error: "agent_auth_unavailable" };

const TOKEN_PATTERN = /^pl_mcp_[A-Za-z0-9_-]{43}$/;
const VALID_SCOPES = new Set<string>(AGENT_SCOPES);

export function extractBearerCredential(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match || !TOKEN_PATTERN.test(match[1])) return null;
  return match[1];
}

export function hashAgentCredential(credential: string): string {
  return createHash("sha256").update(credential).digest("hex");
}

export async function authenticateMcpCredential(
  credential: string,
  client: SupabaseClient = createServiceClient(),
): Promise<McpAuthenticationResult> {
  if (!TOKEN_PATTERN.test(credential)) {
    return { ok: false, status: 401, error: "invalid_agent_credential" };
  }

  const { data: key, error: keyError } = await client
    .from("api_keys")
    .select("id,workspace_id,created_by,scopes,expires_at,revoked_at")
    .eq("key_hash", hashAgentCredential(credential))
    .maybeSingle();

  if (keyError) {
    console.error("[mcp.auth] credential lookup unavailable", {
      providerCode: keyError.code,
    });
    return { ok: false, status: 503, error: "agent_auth_unavailable" };
  }

  const expiresAt = typeof key?.expires_at === "string" ? Date.parse(key.expires_at) : NaN;
  if (
    !key ||
    key.revoked_at ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    !Array.isArray(key.scopes) ||
    key.scopes.length === 0 ||
    key.scopes.some((scope: unknown) => typeof scope !== "string" || !VALID_SCOPES.has(scope))
  ) {
    return { ok: false, status: 401, error: "invalid_agent_credential" };
  }

  const { data: membership, error: membershipError } = await client
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", key.workspace_id)
    .eq("user_id", key.created_by)
    .maybeSingle();

  if (membershipError) {
    console.error("[mcp.auth] membership lookup unavailable", {
      credentialId: key.id,
      providerCode: membershipError.code,
    });
    return { ok: false, status: 503, error: "agent_auth_unavailable" };
  }

  if (!membership || !["owner", "admin", "member"].includes(membership.role)) {
    return { ok: false, status: 401, error: "invalid_agent_credential" };
  }

  const { data: workspace, error: workspaceError } = await client
    .from("workspaces")
    .select("plan")
    .eq("id", key.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    console.error("[mcp.auth] workspace lookup unavailable", {
      credentialId: key.id,
      providerCode: workspaceError.code,
    });
    return { ok: false, status: 503, error: "agent_auth_unavailable" };
  }
  if (!workspace || !(workspace.plan in PLANS) || !PLANS[workspace.plan as keyof typeof PLANS].apiAccess) {
    return { ok: false, status: 401, error: "invalid_agent_credential" };
  }

  const { error: usageError } = await client
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id)
    .eq("workspace_id", key.workspace_id)
    .is("revoked_at", null);

  if (usageError) {
    console.warn("[mcp.auth] last-used update failed", {
      credentialId: key.id,
      providerCode: usageError.code,
    });
  }

  return {
    ok: true,
    principal: {
      credentialId: key.id,
      workspaceId: key.workspace_id,
      userId: key.created_by,
      role: membership.role as Role,
      scopes: new Set(key.scopes as AgentScope[]),
    },
  };
}
