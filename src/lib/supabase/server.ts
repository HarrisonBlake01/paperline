// =====================================================================
// Server-side Supabase clients.
// =====================================================================
// We bypass Supabase Auth entirely and use Clerk for identity. The
// service-role client is used for trusted server actions and webhooks.
// For end-user requests we still go through the service role but apply
// our own workspace-membership checks (RLS is enabled as a safety net
// when the client connects with a user JWT).
// =====================================================================

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or service role key.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
