// =====================================================================
// Server-side helpers to resolve the current user's workspace + role.
// =====================================================================

import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Role, Workspace } from "@/lib/types";

export interface WorkspaceContext {
  userId: string;
  workspace: Workspace;
  role: Role;
}

/**
 * Get the active workspace for the signed-in user.
 *
 * Strategy: pick the workspace from the request cookie `pl_ws`, falling back
 * to the user's first membership. We auto-create a personal workspace on
 * first sign-in (handled separately in the Clerk webhook).
 */
export async function getActiveWorkspace(
  preferredWorkspaceId?: string,
): Promise<WorkspaceContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const sb = createServiceClient();

  // Pull all memberships for this user
  const { data: memberships, error: mErr } = await sb
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId);

  if (mErr) throw mErr;
  if (!memberships?.length) return null;

  const target =
    memberships.find((m) => m.workspace_id === preferredWorkspaceId) ??
    memberships[0];

  const { data: ws, error: wErr } = await sb
    .from("workspaces")
    .select("*")
    .eq("id", target.workspace_id)
    .single();

  if (wErr) throw wErr;

  return {
    userId,
    workspace: ws as Workspace,
    role: target.role as Role,
  };
}

/**
 * Throwing variant for protected route handlers.
 */
export async function requireWorkspace(
  preferredWorkspaceId?: string,
): Promise<WorkspaceContext> {
  const ctx = await getActiveWorkspace(preferredWorkspaceId);
  if (!ctx) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return ctx;
}

export function isAdmin(role: Role): boolean {
  return role === "owner" || role === "admin";
}
