"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/app/kiosk/fixtures";
import type { SceneProps } from "../types";
import { useTypewriter } from "../use-kiosk-timeline";

const ADDRESS = "432 Noe St, San Francisco, CA";

export function SceneBookingForm({ chefs, isActive }: SceneProps) {
  const chef = chefs.find((c) => c.id === "chef-tanaka") ?? chefs[0];
  const typedAddress = useTypewriter(isActive ? ADDRESS : undefined, {
    startDelay: 1000,
    charMs: 55,
    active: isActive,
  });
  const typingComplete = typedAddress.length === ADDRESS.length;

  const [guests, setGuests] = useState(2);
  useEffect(() => {
    if (!isActive) {
      setGuests(2);
      return;
    }
    const t1 = setTimeout(() => setGuests(4), 5200);
    const t2 = setTimeout(() => setGuests(6), 6800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isActive]);

  const total = chef.menu.price_per_person_cents * guests;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-6 px-8 py-10 text-zinc-100">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Request a booking
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {chef.display_name} · {chef.menu.name}
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="flex items-baseline justify-between">
            <span className="text-zinc-300">Event date &amp; time</span>
            <span className="text-xs text-zinc-500">~4h service window</span>
          </span>
          <div className="kiosk-input text-zinc-200">
            May 8, 2026 · 7:00 PM
          </div>
        </label>

        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-baseline justify-between">
              <span className="text-zinc-300">Guests</span>
              <span className="text-xs text-zinc-500">
                {chef.menu.min_guests}–{chef.menu.max_guests}
              </span>
            </span>
            <div className="kiosk-input tabular-nums">
              <span key={guests} className="kiosk-counter">
                {guests}
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-300">Event address</span>
            <div className="kiosk-input text-zinc-200">
              {typedAddress}
              {!typingComplete && isActive && (
                <span className="kiosk-caret">|</span>
              )}
            </div>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-300">Notes for the chef (optional)</span>
          <div className="kiosk-input h-20 text-zinc-500">
            Dietary needs, kitchen notes, occasion...
          </div>
        </label>

        <div className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-zinc-400">{chef.menu.name}</span>
            <span className="tabular-nums">
              {formatPrice(chef.menu.price_per_person_cents, chef.menu.currency)} × {guests}
            </span>
          </div>
          <div className="flex items-baseline justify-between font-medium">
            <span>Estimated total</span>
            <span key={total} className="kiosk-counter tabular-nums">
              {formatPrice(total, chef.menu.currency)}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Price is locked at request time. The chef still needs to accept.
          </p>
        </div>

        <div>
          <div className="kiosk-cta-highlight inline-flex rounded-md bg-white px-4 py-2.5 text-sm font-medium text-zinc-900">
            Request booking
          </div>
        </div>
      </div>
    </div>
  );
}
