import { createClient } from "@supabase/supabase-js";

// Server-only admin client using the service role key. Bypasses RLS. Never
// expose this — check for NEXT_PUBLIC_ prefix on any key you pass to a client
// component.
//
// Uses SUPABASE_URL (internal kong hostname) since this only runs inside the
// web container.
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example)",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
