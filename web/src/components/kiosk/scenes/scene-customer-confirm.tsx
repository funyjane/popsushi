"use client";

import { formatPrice } from "@/app/kiosk/fixtures";
import type { SceneProps } from "../types";

export function SceneCustomerConfirm({ chefs }: SceneProps) {
  const chef = chefs.find((c) => c.id === "chef-tanaka") ?? chefs[0];
  return (
    <article className="mx-auto flex h-full max-w-3xl flex-col gap-6 px-8 py-10 text-zinc-100">
      <header className="flex flex-col gap-2">
        <div className="text-sm text-zinc-500">← All bookings</div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {chef.display_name}
          </h1>
          <span className="inline-flex items-center rounded-full border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-xs font-medium capitalize text-emerald-200">
            accepted
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
            Chef base
          </div>
          <div>{chef.base_address}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Price (locked at request)
          </div>
          <div className="tabular-nums">
            {formatPrice(chef.menu.price_per_person_cents * 6)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Confirmed
          </div>
          <div>just now</div>
        </div>
      </section>

      <section className="rounded-md border border-emerald-900 bg-emerald-950 p-4 text-sm leading-relaxed text-emerald-100">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Chef's note
        </div>
        Looking forward to cooking for you. I'll reach out the day before to
        confirm the kitchen layout. Happy 40th to your husband.
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Timeline
        </h2>
        <ol className="flex flex-col gap-2 text-sm">
          <li className="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-3">
            <span className="tabular-nums text-xs text-zinc-500">
              Apr 22, 2:31 PM
            </span>
            <span>booking requested</span>
          </li>
          <li className="flex items-start gap-3 rounded-md border border-emerald-900 bg-emerald-950 p-3">
            <span className="tabular-nums text-xs text-emerald-300">
              Apr 22, 2:33 PM
            </span>
            <span className="text-emerald-200">pending → accepted</span>
          </li>
        </ol>
      </section>
    </article>
  );
}
