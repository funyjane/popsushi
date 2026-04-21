import Link from "next/link";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatEventAt, formatPrice } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, event_at, event_address, guest_count, status, price_snapshot_cents, created_at, menus!inner(name, currency), chef_profiles!inner(profiles!inner(display_name))",
    )
    .order("event_at", { ascending: true });

  if (error) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <Link href="/search" className="text-sm underline">
          Find a chef
        </Link>
      </header>

      {bookings && bookings.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => {
            // PostgREST returns embedded relations as objects (inner join
            // guarantees non-null). Types are narrowed at runtime.
            const chefName = (
              b.chef_profiles as { profiles: { display_name: string } }
            ).profiles.display_name;
            const menu = b.menus as { name: string; currency: string };
            return (
              <li key={b.id}>
                <Link
                  href={`/bookings/${b.id}`}
                  className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-4 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold">{chefName}</h2>
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
          No bookings yet.{" "}
          <Link href="/search" className="underline">
            Find a chef
          </Link>{" "}
          to start one.
        </div>
      )}
    </section>
  );
}
