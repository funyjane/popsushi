"use client";

import { formatPrice } from "@/app/kiosk/fixtures";
import type { SceneProps } from "../types";

export function SceneChefDetail({ chefs }: SceneProps) {
  const chef = chefs.find((c) => c.id === "chef-tanaka") ?? chefs[0];
  return (
    <article className="mx-auto flex h-full max-w-3xl flex-col gap-6 px-8 py-10 text-zinc-100">
      <header className="flex flex-col gap-2">
        <div className="text-sm text-zinc-500">← Back to search</div>
        <h1 className="text-4xl font-semibold tracking-tight">
          {chef.display_name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
          <span className="text-amber-400">★ {chef.avg_rating.toFixed(1)}</span>
          <span className="text-zinc-500">({chef.review_count} reviews)</span>
          <span>· {chef.base_address}</span>
          <span>· {chef.years_experience} years experience</span>
        </div>
      </header>

      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          About
        </h2>
        <p className="text-sm leading-relaxed text-zinc-200">{chef.bio}</p>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-semibold tracking-tight">
            {chef.menu.name}
          </h2>
          <p className="text-sm text-zinc-500">
            {formatPrice(chef.menu.price_per_person_cents, chef.menu.currency)} / person
            · {chef.menu.min_guests}–{chef.menu.max_guests} guests
          </p>
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">
          {chef.menu.description}
        </p>
        <div className="mt-1">
          <div className="kiosk-cta-highlight inline-flex rounded-md bg-white px-4 py-2.5 text-sm font-medium text-zinc-900">
            Request booking
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Reviews
        </h2>
        <ul className="flex flex-col gap-2">
          <li className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
            <div className="mb-1 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Hana Customer</span>
                <span className="text-amber-400">★★★★★</span>
              </div>
              <span className="text-xs text-zinc-500">2 weeks ago</span>
            </div>
            <p className="text-zinc-300">
              Best omakase I've had outside Tokyo. Tanaka brought everything.
              We just set the table.
            </p>
          </li>
          <li className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm">
            <div className="mb-1 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Taro Customer</span>
                <span className="text-amber-400">★★★★★</span>
              </div>
              <span className="text-xs text-zinc-500">a month ago</span>
            </div>
            <p className="text-zinc-300">
              Worth every penny for an anniversary. The uni course ruined all
              other uni for me.
            </p>
          </li>
        </ul>
      </section>
    </article>
  );
}
