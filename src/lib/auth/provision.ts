import { createServiceClient } from "@/lib/supabase/server";
import { getBasicUser } from "@/lib/auth/clerk-users";
import { PLANS } from "@/lib/plans";
import type { Role, Workspace } from "@/lib/types";

export interface WorkspaceContext {
  userId: string;
  workspace: Workspace;
  role: Role;
}

export interface ProvisionedWorkspaceContext extends WorkspaceContext {
  created: boolean;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "workspace";
}

export async function provisionPersonalWorkspace(
  userId: string,
): Promise<ProvisionedWorkspaceContext | null> {
  const sb = createServiceClient();

  const { data: existing } = await sb
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .limit(1);

  if (existing?.length) {
    const membership = existing[0];
    const { data: ws, error: wsErr } = await sb
      .from("workspaces")
      .select("*")
      .eq("id", membership.workspace_id)
      .single();

    if (wsErr || !ws) throw wsErr ?? new Error("Workspace not found.");

    return {
      userId,
      workspace: ws as Workspace,
      role: membership.role as Role,
      created: false,
    };
  }

  const clerkUser = await getBasicUser(userId);
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.email?.split("@")[0] ||
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
    throw wsErr ?? new Error("Failed to create workspace.");
  }

  const { error: memErr } = await sb.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: userId,
    role: "owner",
  });

  if (memErr) {
    const { data: retry } = await sb
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId)
      .limit(1);

    if (!retry?.length) {
      throw memErr;
    }
  }

  await sb.from("audit_logs").insert({
    workspace_id: ws.id,
    actor_user_id: userId,
    action: "workspace.created",
    target_type: "workspace",
    target_id: ws.id,
    metadata: { source: "auto.provision" },
  });

  return {
    userId,
    workspace: ws as Workspace,
    role: "owner",
    created: true,
  };
}
