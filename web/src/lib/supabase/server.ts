import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_COOKIE_OPTIONS } from "./cookie-config";

// Server client for Server Components / Server Actions / Route Handlers.
// Reads the auth cookie from the request; writes back on token refresh
// (silently no-ops in Server Components, which can't mutate cookies —
// proxy.ts handles the real refresh).
//
// Uses SUPABASE_URL (internal kong hostname, e.g. http://kong:8000) when
// available — this runs inside the web container and cannot reach the
// browser-facing localhost:54321. Falls back to the public URL for local
// dev outside Docker. The cookie name is pinned in SUPABASE_COOKIE_OPTIONS
// so browser and server agree despite the URL split.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(
    url,
    key,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't mutate cookies — proxy.ts refreshes.
          }
        },
      },
    },
  );
}
