"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/app/kiosk/fixtures";
import { SearchMap } from "@/components/search-map";
import type { SceneProps } from "../types";

// Customer pin animates from SF downtown → Mission over the first few seconds
// so viewers see the "drop a pin" behavior without real interaction.
const PIN_START = { lat: 37.7793, lng: -122.4193 }; // SF City Hall
const PIN_END = { lat: 37.7599, lng: -122.4148 }; // Mission District

export function SceneSearch({ chefs, isActive }: SceneProps) {
  const [customer, setCustomer] = useState(PIN_START);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCustomer(PIN_START);
      setRevealed(0);
      return;
    }
    const t1 = setTimeout(() => setCustomer(PIN_END), 1800);
    const t2 = setTimeout(() => setRevealed(1), 3200);
    const t3 = setTimeout(() => setRevealed(2), 4400);
    const t4 = setTimeout(() => setRevealed(3), 5600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isActive]);

  const sorted = useMemo(
    () => [...chefs].sort((a, b) => a.distance_km - b.distance_km),
    [chefs],
  );

  const chefPins = useMemo(
    () =>
      chefs.map((c) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        label: c.display_name,
      })),
    [chefs],
  );

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-5 px-8 py-10 text-zinc-100">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Find a chef</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Drop a pin where your event is. We'll show chefs whose service area
          covers that spot.
        </p>
      </header>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-300">
            Event address <span className="text-xs text-zinc-500">(optional label)</span>
          </span>
          <div className="kiosk-input">e.g. 123 Market St, San Francisco</div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-300">Guests</span>
          <div className="kiosk-input">any</div>
        </label>
      </div>

      <SearchMap
        customer={customer}
        onCustomerChange={setCustomer}
        chefs={chefPins}
        interactive={false}
        heightClass="h-64"
      />

      <ul className="flex flex-col gap-2">
        {sorted.map((r, i) => (
          <li
            key={r.id}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-3 transition-all duration-500"
            style={{
              opacity: revealed > i ? 1 : 0,
              transform: revealed > i ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{r.display_name}</span>
                  <span className="text-amber-400 text-sm">
                    ★ {r.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {r.base_address} · {r.distance_km.toFixed(1)} km
                  </span>
                </div>
                <div className="text-xs text-zinc-300">
                  <strong>{r.menu.name}</strong> —{" "}
                  {formatPrice(r.menu.price_per_person_cents, r.menu.currency)} / person
                </div>
              </div>
              <div className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-zinc-900">
                View
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
