import { createHash, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";

const CHECK_TIMEOUT_MS = 5_000;

export const READINESS_CHECKS = [
  "configuration",
  "database",
  "rate_limit_schema",
  "agent_credential_schema",
  "private_storage",
  "pdf_runtime",
] as const;

export type ReadinessCheckName = (typeof READINESS_CHECKS)[number];
export type ReadinessCheckResult = {
  name: ReadinessCheckName;
  ok: boolean;
};

export type ReadinessProbe = () => Promise<void>;
export type ReadinessProbes = Record<ReadinessCheckName, ReadinessProbe>;

export async function runReadinessChecks(
  probes: ReadinessProbes = createDefaultReadinessProbes(),
): Promise<{ ready: boolean; checks: ReadinessCheckResult[] }> {
  const checks = await Promise.all(
    READINESS_CHECKS.map(async (name) => {
      try {
        await withTimeout(probes[name](), CHECK_TIMEOUT_MS);
        return { name, ok: true };
      } catch (error) {
        console.error("[readiness] dependency check failed", {
          check: name,
          errorType: error instanceof Error ? error.name : "UnknownError",
          errorCode:
            typeof error === "object" && error !== null && "code" in error
              ? String(error.code)
              : "unknown",
        });
        return { name, ok: false };
      }
    }),
  );
  return { ready: checks.every((check) => check.ok), checks };
}

export function isReadinessAuthorized(
  authorization: string | null,
  expectedToken: string | undefined,
): boolean {
  if (!expectedToken || expectedToken.length < 32 || !authorization) return false;
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match) return false;
  const actual = createHash("sha256").update(match[1]).digest();
  const expected = createHash("sha256").update(expectedToken).digest();
  return timingSafeEqual(actual, expected);
}

function createDefaultReadinessProbes(): ReadinessProbes {
  return {
    async configuration() {
      const required = [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        process.env.CLERK_SECRET_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        process.env.OPENAI_API_KEY,
        process.env.PAPERLINE_MCP_ALLOWED_HOSTS,
        process.env.PAPERLINE_READINESS_TOKEN,
      ];
      if (required.some((value) => !value?.trim())) throw new Error("not_configured");
    },

    async database() {
      const { error } = await createServiceClient()
        .from("workspaces")
        .select("id")
        .limit(1);
      if (error) throw new Error("database_unavailable");
    },

    async rate_limit_schema() {
      const { error } = await createServiceClient()
        .from("workspace_rate_limits")
        .select("workspace_id")
        .limit(1);
      if (error) throw new Error("rate_limit_schema_unavailable");
    },

    async agent_credential_schema() {
      const { error } = await createServiceClient()
        .from("api_keys")
        .select("id,scopes,expires_at")
        .limit(1);
      if (error) throw new Error("agent_credential_schema_unavailable");
    },

    async private_storage() {
      const bucket = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
      const { data, error } = await createServiceClient().storage.getBucket(bucket);
      if (error || !data || data.public) throw new Error("private_storage_unavailable");
    },

    async pdf_runtime() {
      let pdfjs: { getDocument?: unknown };
      let worker: { WorkerMessageHandler?: unknown };
      let canvas: { createCanvas?: unknown };
      try {
        pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      } catch {
        throw readinessDependencyError("pdfjs_import");
      }
      try {
        worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      } catch {
        throw readinessDependencyError("pdf_worker_import");
      }
      try {
        canvas = await import("@napi-rs/canvas");
      } catch {
        throw readinessDependencyError("canvas_import");
      }
      if (
        typeof pdfjs.getDocument !== "function" ||
        !worker.WorkerMessageHandler ||
        typeof canvas.createCanvas !== "function"
      ) {
        throw new Error("pdf_runtime_unavailable");
      }
    },
  };
}

function readinessDependencyError(code: string): Error & { code: string } {
  return Object.assign(new Error("readiness_dependency_unavailable"), { code });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error("readiness_timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
