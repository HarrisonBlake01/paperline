// =====================================================================
// Usage metering — track pages, tokens, and storage per workspace.
// =====================================================================

import { createServiceClient } from "@/lib/supabase/server";
import { getPlan, isOverPageLimit } from "@/lib/plans";
import type { Workspace } from "@/lib/types";

export type UsageKind = "pages" | "tokens" | "storage";

/**
 * Record a usage event AND increment the rolled-up counter on the workspace.
 * Page counts roll up to `pages_used_this_period` (used for plan caps).
 */
export async function recordUsage(opts: {
  workspaceId: string;
  kind: UsageKind;
  amount: number;
  costCents?: number;
  referenceId?: string;
}) {
  const sb = createServiceClient();

  await sb.from("usage_events").insert({
    workspace_id: opts.workspaceId,
    kind: opts.kind,
    amount: opts.amount,
    cost_cents: opts.costCents ?? null,
    reference_id: opts.referenceId ?? null,
  });

  if (opts.kind === "pages" && opts.amount > 0) {
    // Postgres RPC would be cleaner; for now do a select+update.
    const { data: ws } = await sb
      .from("workspaces")
      .select("pages_used_this_period")
      .eq("id", opts.workspaceId)
      .single();
    if (ws) {
      await sb
        .from("workspaces")
        .update({
          pages_used_this_period:
            (ws.pages_used_this_period ?? 0) + opts.amount,
        })
        .eq("id", opts.workspaceId);
    }
  }
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: "page_limit_reached";
  pagesUsed: number;
  pagesLimit: number;
}

export function checkQuota(workspace: Workspace, addPages = 0): QuotaCheck {
  const plan = getPlan(workspace.plan);
  const projected = workspace.pages_used_this_period + addPages;
  const allowed = !isOverPageLimit(plan, projected);
  return {
    allowed,
    reason: allowed ? undefined : "page_limit_reached",
    pagesUsed: workspace.pages_used_this_period,
    pagesLimit: plan.pagesPerMonth,
  };
}
