import type { SupabaseClient } from "@supabase/supabase-js";

export type StorageCleanupJob = {
  id: string;
  workspace_id: string;
  document_id: string;
  bucket: string;
  storage_path: string;
  attempts: number;
};

function providerErrorCode(error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as { code?: unknown; name?: unknown };
    if (typeof candidate.code === "string") return candidate.code.slice(0, 120);
    if (typeof candidate.name === "string") return candidate.name.slice(0, 120);
  }
  return "unknown";
}

export function storageCleanupRetrySeconds(attempts: number) {
  return Math.min(3600, 30 * 2 ** Math.min(Math.max(attempts, 0), 7));
}

export async function registerStorageCleanupJob(options: {
  client: SupabaseClient;
  workspaceId: string;
  documentId: string;
  bucket: string;
  storagePath: string;
}) {
  const { client, workspaceId, documentId, bucket, storagePath } = options;
  return client
    .from("storage_cleanup_jobs")
    .insert({
      workspace_id: workspaceId,
      document_id: documentId,
      bucket,
      storage_path: storagePath,
    })
    .select("id")
    .single();
}

export async function clearStorageCleanupJob(
  client: SupabaseClient,
  jobId: string,
) {
  return client.from("storage_cleanup_jobs").delete().eq("id", jobId);
}

export async function reconcileStorageCleanupJobs(options: {
  client: SupabaseClient;
  workspaceId: string;
  limit?: number;
}) {
  const { client, workspaceId, limit = 5 } = options;
  const now = new Date();
  const { data, error } = await client
    .from("storage_cleanup_jobs")
    .select("id, workspace_id, document_id, bucket, storage_path, attempts")
    .eq("workspace_id", workspaceId)
    .lte("next_attempt_at", now.toISOString())
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 20)));

  if (error) return { processed: 0, failed: 0, error };

  let processed = 0;
  let failed = 0;
  for (const rawJob of data ?? []) {
    const job = rawJob as StorageCleanupJob;
    const { data: committedDocument, error: documentError } = await client
      .from("documents")
      .select("id")
      .eq("id", job.document_id)
      .eq("workspace_id", job.workspace_id)
      .eq("storage_path", job.storage_path)
      .maybeSingle();

    if (documentError) {
      failed += 1;
      continue;
    }

    // A matching metadata row makes the object live, not orphaned. Clearing a
    // stale queue row must never delete a committed document's storage object.
    if (committedDocument) {
      const { error: clearError } = await clearStorageCleanupJob(client, job.id);
      if (clearError) failed += 1;
      else processed += 1;
      continue;
    }

    const { error: removeError } = await client.storage
      .from(job.bucket)
      .remove([job.storage_path]);
    if (!removeError) {
      const { error: clearError } = await clearStorageCleanupJob(client, job.id);
      if (clearError) failed += 1;
      else processed += 1;
      continue;
    }

    failed += 1;
    const attempts = job.attempts + 1;
    const nextAttempt = new Date(
      now.getTime() + storageCleanupRetrySeconds(attempts) * 1000,
    );
    await client
      .from("storage_cleanup_jobs")
      .update({
        attempts,
        last_error: providerErrorCode(removeError),
        next_attempt_at: nextAttempt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", job.id);
  }

  return { processed, failed, error: null };
}
