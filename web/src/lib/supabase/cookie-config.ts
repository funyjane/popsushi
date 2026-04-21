// Constant cookie name so browser and server agree regardless of the
// SUPABASE_URL they were each configured with. Without this, @supabase/ssr
// derives the cookie name from the URL host — browser uses localhost:54321,
// server uses kong:8000, and the names wouldn't match.
export const SUPABASE_COOKIE_OPTIONS = {
  name: "sb-popsushi-auth-token",
} as const;
