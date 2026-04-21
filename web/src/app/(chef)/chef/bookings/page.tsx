import Link from "next/link";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatEventAt, formatPrice } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Status order for the list: pending first (the chef needs to act), then
// accepted, then the terminal bins.
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  accepted: 1,
  completed: 2,
  declined: 3,
  cancelled: 4,
};

export default async function ChefBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [setup, bookings] = await Promise.all([
    (async () => {
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
      return { chefProfile, publishedMenu };
    })(),
    supabase
      .from("bookings")
      .select(
        "id, event_at, event_address, guest_count, status, price_snapshot_cents, created_at, customer_id, menus!inner(name, currency), profiles!bookings_customer_id_fkey!inner(display_name)",
      )
      .eq("chef_id", user.id)
      .order("event_at", { ascending: true }),
  ]);

  const { chefProfile, publishedMenu } = setup;
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

  const sorted = [...(bookings.data ?? [])].sort((a, b) => {
    const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (r !== 0) return r;
    return (
      new Date(a.event_at).getTime() - new Date(b.event_at).getTime()
    );
  });

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

      {sorted.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {sorted.map((b) => {
            const customer = b.profiles as { display_name: string };
            const menu = b.menus as { name: string; currency: string };
            return (
              <li key={b.id}>
                <Link
                  href={`/chef/bookings/${b.id}`}
                  className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-4 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold">
                      {customer.display_name}
                    </h2>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{menu.name}</span>
                    <span>·</span>
                    <span>{formatEventAt(b.event_at)}</span>
                    <span>·</span>
                    <span>{b.guest_count} guests</span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {formatPrice(b.price_snapshot_cents, menu.currency)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">{b.event_address}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
          No incoming requests yet.
        </div>
      )}
    </section>
  );
}
