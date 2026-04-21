import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChefBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: chefProfile }, { data: publishedMenu }] = await Promise.all([
    supabase
      .from("chef_profiles")
      .select("profile_id, is_active")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("menus")
      .select("id")
      .eq("chef_id", user.id)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const steps = [
    {
      done: !!chefProfile,
      label: "Create your chef profile",
      href: "/chef/profile",
    },
    {
      done: !!publishedMenu,
      label: "Publish a menu",
      href: "/chef/menu",
    },
  ];
  const allDone = steps.every((s) => s.done);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Booking requests</h1>

      {!allDone && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Finish setup to start appearing in search
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {steps.map((s) => (
              <li key={s.href} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={
                    s.done
                      ? "inline-block h-4 w-4 rounded-full bg-emerald-500"
                      : "inline-block h-4 w-4 rounded-full border border-amber-500"
                  }
                />
                <span
                  className={
                    s.done
                      ? "text-zinc-600 line-through dark:text-zinc-400"
                      : "text-amber-900 dark:text-amber-100"
                  }
                >
                  {s.label}
                </span>
                {!s.done && (
                  <Link
                    href={s.href}
                    className="ml-auto text-xs font-medium text-amber-900 underline dark:text-amber-200"
                  >
                    Go →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allDone && chefProfile && !chefProfile.is_active && (
        <div className="rounded-md border border-zinc-300 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          You're currently <strong>not accepting bookings</strong>. Flip
          "Accepting bookings" on your{" "}
          <Link href="/chef/profile" className="underline">
            profile
          </Link>{" "}
          to appear in search.
        </div>
      )}

      <p className="text-zinc-600 dark:text-zinc-400">No incoming requests yet.</p>
      <div className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        Real request list + Accept/Decline lands in Phase 4.
      </div>
    </section>
  );
}
