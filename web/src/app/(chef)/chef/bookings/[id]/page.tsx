import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatEventAt, formatPrice, formatRelative } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChefBookingActions } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ChefBookingDetail({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, event_at, event_address, guest_count, status, price_snapshot_cents, notes, chef_response_note, decline_reason, created_at, cancelled_at, completed_at, customer_id, menu_id, menus!inner(name, description, currency), profiles!bookings_customer_id_fkey!inner(display_name, phone)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const { data: events } = await supabase
    .from("booking_events")
    .select("from_status, to_status, note, created_at")
    .eq("booking_id", id)
    .order("created_at", { ascending: true });

  const customer = booking.profiles as {
    display_name: string;
    phone: string | null;
  };
  const menu = booking.menus as {
    name: string;
    description: string;
    currency: string;
  };

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/chef/bookings"
          className="text-sm text-zinc-500 hover:underline"
        >
          ← All requests
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.display_name}
          </h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {menu.name} · {formatEventAt(booking.event_at)} ·{" "}
          {booking.guest_count} guests
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 rounded-md border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Event address
          </div>
          <div>{booking.event_address}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Payout (at current guest count)
          </div>
          <div className="tabular-nums">
            {formatPrice(booking.price_snapshot_cents, menu.currency)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Customer phone
          </div>
          <div>{customer.phone ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Requested
          </div>
          <div>{formatRelative(booking.created_at)}</div>
        </div>
      </section>

      {booking.notes && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500">
            Customer note
          </h2>
          <p className="whitespace-pre-line rounded-md border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {booking.notes}
          </p>
        </section>
      )}

      {booking.chef_response_note && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500">
            Your note to customer
          </h2>
          <p className="whitespace-pre-line rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
            {booking.chef_response_note}
          </p>
        </section>
      )}

      {booking.decline_reason && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500">
            Decline reason
          </h2>
          <p className="whitespace-pre-line rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {booking.decline_reason}
          </p>
        </section>
      )}

      <ChefBookingActions bookingId={booking.id} status={booking.status} />

      <section className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-wide text-zinc-500">
          Timeline
        </h2>
        <ol className="flex flex-col gap-2 text-sm">
          {(events ?? []).map((e, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-xs text-zinc-500 tabular-nums">
                {formatEventAt(e.created_at)}
              </span>
              <span>
                {e.from_status
                  ? `${e.from_status} → ${e.to_status}`
                  : e.note ?? e.to_status}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
