"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchMap } from "@/components/search-map";
import { StarRating } from "@/components/star-rating";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// SF city hall — sensible default so the map has data on first paint.
const DEFAULT_LOCATION = { lat: 37.7793, lng: -122.4193 };

type ChefResult = {
  chef_id: string;
  display_name: string;
  avatar_path: string | null;
  base_address: string;
  chef_lat: number;
  chef_lng: number;
  years_experience: number | null;
  avg_rating: number | null;
  review_count?: number | null;
  distance_km: number;
  menu_id: string;
  menu_name: string;
  menu_description: string;
  price_per_person_cents: number;
  currency: string;
  min_guests: number;
  max_guests: number;
};

export default function SearchPage() {
  const [customer, setCustomer] = useState(DEFAULT_LOCATION);
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState<string>("");
  const [results, setResults] = useState<ChefResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const reqSeq = useRef(0);

  useEffect(() => {
    const myReq = ++reqSeq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const guestNum = guests.trim() === "" ? null : Number(guests);
      const { data, error } = await supabase.rpc("search_chefs", {
        p_lat: customer.lat,
        p_lng: customer.lng,
        p_guest_count: Number.isFinite(guestNum) ? guestNum : null,
      });
      // Drop stale responses if a newer request fired.
      if (myReq !== reqSeq.current) return;
      if (error) {
        setError(error.message);
        setResults([]);
      } else {
        setError(null);
        setResults((data ?? []) as ChefResult[]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [customer, guests, supabase]);

  const chefPins = results.map((r) => ({
    id: r.chef_id,
    lat: r.chef_lat,
    lng: r.chef_lng,
    label: r.display_name,
  }));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Find a chef</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Drop a pin where your event is. We'll show chefs whose service area
          covers that spot.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">
            Event address{" "}
            <span className="text-xs text-zinc-500">(optional label)</span>
          </span>
          <input
            className="input"
            placeholder="e.g. 123 Market St, San Francisco"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Guests</span>
          <input
            type="number"
            min={1}
            max={200}
            className="input"
            placeholder="any"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          />
        </label>
      </div>

      <SearchMap
        customer={customer}
        onCustomerChange={setCustomer}
        chefs={chefPins}
        onChefClick={(id) => {
          const href = detailHref(id, customer, address, guests);
          window.location.href = href;
        }}
      />

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          Pin: <span className="tabular-nums">{customer.lat.toFixed(5)}, {customer.lng.toFixed(5)}</span>
        </span>
        <span>
          {loading
            ? "Searching..."
            : `${results.length} chef${results.length === 1 ? "" : "s"} found`}
        </span>
      </div>

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && results.length === 0 && !error && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
          No chefs match this location
          {guests.trim() ? ` for ${guests} guests` : ""}. Try dragging the pin
          to a different area{guests.trim() ? " or loosening the guest count" : ""}.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {results.map((r) => (
          <li
            key={r.chef_id}
            className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {r.display_name}
                  </h2>
                  {r.avg_rating !== null && (
                    <StarRating
                      value={Number(r.avg_rating)}
                      size="sm"
                      showValue
                      reviewCount={r.review_count ?? undefined}
                    />
                  )}
                  <span className="text-xs text-zinc-500">
                    {r.base_address} · {r.distance_km.toFixed(1)} km
                  </span>
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  <strong>{r.menu_name}</strong> —{" "}
                  {formatPrice(r.price_per_person_cents, r.currency)} / person ·
                  {" "}
                  {r.min_guests}–{r.max_guests} guests
                </div>
                <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {r.menu_description}
                </p>
              </div>
              <Link
                href={detailHref(r.chef_id, customer, address, guests)}
                className="btn-primary shrink-0 self-start"
              >
                View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function detailHref(
  chefId: string,
  loc: { lat: number; lng: number },
  address: string,
  guests: string,
) {
  const qs = new URLSearchParams({
    lat: loc.lat.toString(),
    lng: loc.lng.toString(),
  });
  if (address.trim()) qs.set("address", address.trim());
  if (guests.trim()) qs.set("guests", guests.trim());
  return `/chefs/${chefId}?${qs.toString()}`;
}

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(0)} ${currency}`;
  }
}
