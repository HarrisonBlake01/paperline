import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { authenticateMcpCredential } from "../src/lib/mcp/auth";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const allowMutation = process.env.PAPERLINE_ALLOW_CANDIDATE_DB_TESTS === "true";
const expectedProjectRef = process.env.PAPERLINE_CANDIDATE_SUPABASE_REF;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!allowMutation) {
  throw new Error("Set PAPERLINE_ALLOW_CANDIDATE_DB_TESTS=true for an approved disposable target.");
}
if (!expectedProjectRef || !supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Candidate project identity or Supabase credentials are missing.");
}

const projectHost = new URL(supabaseUrl).hostname;
if (!projectHost.startsWith(`${expectedProjectRef}.`)) {
  throw new Error("Configured Supabase URL does not match PAPERLINE_CANDIDATE_SUPABASE_REF.");
}

const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonymous = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = randomUUID();
const userId = `candidate_user_${suffix}`;
let workspaceId: string | null = null;

async function consume(action: string, limit: number) {
  const { data, error } = await service.rpc("consume_workspace_rate_limit", {
    p_workspace_id: workspaceId,
    p_action: action,
    p_limit: limit,
    p_window_seconds: 300,
  });
  assert.equal(error, null, `rate-limit RPC failed: ${error?.code ?? "unknown"}`);
  const row = Array.isArray(data) ? data[0] : data;
  assert.ok(row);
  return Boolean(row.allowed);
}

async function main() {
  try {
    const { data: workspace, error: workspaceError } = await service
      .from("workspaces")
      .insert({
        slug: `candidate-${suffix}`,
        name: "Candidate verification workspace",
        plan: "free",
        pages_limit: 25,
      })
      .select("id")
      .single();
    assert.equal(workspaceError, null, `workspace setup failed: ${workspaceError?.code ?? "unknown"}`);
    assert.ok(workspace?.id);
    workspaceId = workspace.id;

    const { error: memberError } = await service.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: "owner",
    });
    assert.equal(memberError, null, `membership setup failed: ${memberError?.code ?? "unknown"}`);

    const sequentialAction = `candidate_seq_${suffix}`.slice(0, 64);
    assert.deepEqual(
      [
        await consume(sequentialAction, 2),
        await consume(sequentialAction, 2),
        await consume(sequentialAction, 2),
      ],
      [true, true, false],
    );

    const concurrentAction = `candidate_con_${suffix}`.slice(0, 64);
    const concurrent = await Promise.all(
      Array.from({ length: 10 }, () => consume(concurrentAction, 5)),
    );
    assert.equal(concurrent.filter(Boolean).length, 5);

    const token = `pl_mcp_${randomBytes(32).toString("base64url")}`;
    const digest = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data: credential, error: credentialError } = await service
      .from("api_keys")
      .insert({
        workspace_id: workspaceId,
        name: "Candidate verification credential",
        prefix: token.slice(0, 14),
        key_hash: digest,
        created_by: userId,
        scopes: ["documents:read", "templates:read"],
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    assert.equal(
      credentialError,
      null,
      `credential setup failed: ${credentialError?.code ?? "unknown"}`,
    );
    assert.ok(credential?.id);

    const authenticated = await authenticateMcpCredential(token, service);
    assert.equal(authenticated.ok, true, "Free-plan credential should authenticate");

    const { error: duplicateError } = await service.from("api_keys").insert({
      workspace_id: workspaceId,
      name: "Duplicate digest should fail",
      prefix: "pl_mcp_duplicate",
      key_hash: digest,
      created_by: userId,
      scopes: ["documents:read"],
      expires_at: expiresAt,
    });
    assert.equal(duplicateError?.code, "23505");

    const { error: expireError } = await service
      .from("api_keys")
      .update({ expires_at: "2020-01-01T00:00:00.000Z" })
      .eq("id", credential.id);
    assert.equal(expireError, null);
    assert.equal((await authenticateMcpCredential(token, service)).ok, false);

    const { error: revokeError } = await service
      .from("api_keys")
      .update({ expires_at: expiresAt, revoked_at: new Date().toISOString() })
      .eq("id", credential.id);
    assert.equal(revokeError, null);
    assert.equal((await authenticateMcpCredential(token, service)).ok, false);

    for (const table of ["workspaces", "documents", "api_keys"] as const) {
      const { data, error } = await anonymous.from(table).select("*").limit(1);
      if (error) {
        assert.equal(error.code, "42501", `anonymous ${table} denial was unexpected`);
      } else {
        assert.deepEqual(data, []);
      }
    }

    const { error: anonymousRpcError } = await anonymous.rpc(
      "consume_workspace_rate_limit",
      {
        p_workspace_id: workspaceId,
        p_action: "anonymous_denied",
        p_limit: 1,
        p_window_seconds: 60,
      },
    );
    assert.ok(anonymousRpcError, "anonymous limiter invocation must be denied");

    const bucketName = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
    const { data: bucket, error: bucketError } = await service.storage.getBucket(bucketName);
    assert.equal(bucketError, null, `bucket lookup failed: ${bucketError?.message ?? "unknown"}`);
    assert.equal(bucket?.public, false, "document bucket must remain private");

    console.log("✓ Candidate DB migrations, Free credential lifecycle, atomic limits, anon denial, and private storage verified");
  } finally {
    if (workspaceId) {
      const { error } = await service.from("workspaces").delete().eq("id", workspaceId);
      if (error) {
        console.error("Candidate cleanup failed", { providerCode: error.code });
        process.exitCode = 1;
      }
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Candidate verification failed");
  process.exitCode = 1;
});
