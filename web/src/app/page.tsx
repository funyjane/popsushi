import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "chef") redirect("/chef/bookings");
    if (profile?.role === "customer") redirect("/bookings");
    // no profile yet (trigger failed or mid-signup) — fall through to landing
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">PopSushi</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Book a private sushi chef for your home or event.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="flex-1 rounded-md bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="flex-1 rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Log in
        </Link>
      </div>

      <div>
        <Link
          href="/kiosk"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span aria-hidden>▶</span> Watch demo
        </Link>
      </div>

      <footer className="mt-8 text-xs text-zinc-500 dark:text-zinc-500">
        <p>Local dev services:</p>
        <ul className="mt-1 space-y-0.5">
          <li>
            <a className="underline" href="http://localhost:54323">
              Supabase Studio
            </a>
          </li>
          <li>
            <a className="underline" href="http://localhost:54324">
              Inbucket (auth emails)
            </a>
          </li>
        </ul>
      </footer>
    </main>
  );
}
