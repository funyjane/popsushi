// Next 16 renamed `middleware` -> `proxy`. Exports a `proxy` function, runs
// on nodejs runtime (edge not supported here). Refreshes the Supabase auth
// session on every request so access tokens don't silently expire.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookie-config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // See lib/supabase/server.ts — prefer internal hostname for server-side
  // fetches; the browser client uses NEXT_PUBLIC_SUPABASE_URL instead.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(
    url,
    key,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Calling getUser() triggers the session refresh machinery. The SDK writes
  // refreshed tokens back via setAll above, which we relay to the response.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static image extensions.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
