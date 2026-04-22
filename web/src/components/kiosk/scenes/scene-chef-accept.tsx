"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/app/kiosk/fixtures";
import type { SceneProps } from "../types";

export function SceneChefAccept({ chefs, isActive }: SceneProps) {
  const chef = chefs.find((c) => c.id === "chef-tanaka") ?? chefs[0];
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setAccepted(false);
      return;
    }
    const t = setTimeout(() => setAccepted(true), 4200);
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <article className="mx-auto flex h-full max-w-3xl flex-col gap-6 px-8 py-10 text-zinc-100">
      <header className="flex flex-col gap-2">
        <div className="text-sm text-zinc-500">← All requests</div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hana Customer
          </h1>
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize transition-colors duration-500"
            style={{
              borderColor: accepted ? "rgb(6 95 70)" : "rgb(146 64 14)",
              background: accepted ? "rgb(2 44 34)" : "rgb(69 26 3)",
              color: accepted ? "rgb(167 243 208)" : "rgb(253 230 138)",
            }}
          >
            {accepted ? "accepted" : "pending"}
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          {chef.menu.name} · May 8, 2026 · 7:00 PM · 6 guests
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 rounded-md border border-zinc-800 bg-zinc-900 p-5 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Event address
          </div>
          <div>432 Noe St, San Francisco, CA</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Distance from you
          </div>
          <div>5.2 km</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Guests
          </div>
          <div>6</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Price (locked at request)
          </div>
          <div className="tabular-nums">
            {formatPrice(chef.menu.price_per_person_cents * 6)}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Note from Hana
        </h2>
        <p className="rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm leading-relaxed text-zinc-300">
          My husband's 40th. He used to live in Tokyo and has been trying to
          recreate it ever since. No shellfish allergies, but skip the uni if
          anything is tricky.
        </p>
      </section>

      {!accepted ? (
        <div className="flex gap-3">
          <div className="kiosk-cta-highlight inline-flex items-center rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white">
            Accept request
          </div>
          <div className="inline-flex items-center rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300">
            Decline
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-emerald-900 bg-emerald-950 p-4 text-sm text-emerald-200">
          ✓ Accepted. Hana has been notified.
        </div>
      )}
    </article>
  );
}
