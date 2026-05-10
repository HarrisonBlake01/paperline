// =====================================================================
// Lightweight env validation. Imported by server entrypoints to fail fast
// when required vars are missing in production.
// =====================================================================

import { z } from "zod";

const REQUIRED_PROD = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
] as const;

const Schema = z
  .object(
    Object.fromEntries(REQUIRED_PROD.map((k) => [k, z.string().min(1)])) as
      Record<(typeof REQUIRED_PROD)[number], z.ZodString>,
  )
  .partial();

let cachedReport: { ok: boolean; missing: string[] } | null = null;

export function checkEnv(): { ok: boolean; missing: string[] } {
  if (cachedReport) return cachedReport;
  const parsed = Schema.safeParse(process.env);
  const env = parsed.success ? parsed.data : {};
  const missing = REQUIRED_PROD.filter((k) => !env[k]);
  cachedReport = { ok: missing.length === 0, missing };
  return cachedReport;
}

export function assertEnvInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  const { ok, missing } = checkEnv();
  if (!ok) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}`,
    );
  }
}
