import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client for Phase 0. Uses the server URL (kong hostname
// inside the Docker network) and the anon key. Phase 1 adds @supabase/ssr
// cookie-aware clients alongside this.
export function createServerAnonClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env.example)",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
