import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GoTrue redirects here after email confirmation with a `?code=...` param.
// We exchange it for a session; proxy.ts then relays the session cookie to
// the browser. After that, the home page routes by role.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          url.origin,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
