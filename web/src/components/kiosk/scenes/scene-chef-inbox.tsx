"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/app/kiosk/fixtures";
import type { SceneProps } from "../types";

export function SceneChefInbox({ chefs, isActive }: SceneProps) {
  const chef = chefs.find((c) => c.id === "chef-tanaka") ?? chefs[0];
  const [interstitialVisible, setInterstitialVisible] = useState(true);
  const [newRequestVisible, setNewRequestVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setInterstitialVisible(true);
      setNewRequestVisible(false);
      return;
    }
    const t1 = setTimeout(() => setInterstitialVisible(false), 2200);
    const t2 = setTimeout(() => setNewRequestVisible(true), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isActive]);

  return (
    <div className="relative h-full w-full">
      {/* Interstitial overlay */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950 transition-opacity duration-700"
        style={{
          opacity: interstitialVisible ? 1 : 0,
          pointerEvents: interstitialVisible ? "auto" : "none",
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Meanwhile
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">
            On the chef's side...
          </h2>
        </div>
      </div>

      <section className="mx-auto flex h-full max-w-3xl flex-col gap-5 px-8 py-10 text-zinc-100">
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Booking requests
          </h1>
          <span className="text-xs text-zinc-500">
            Signed in as {chef.display_name}
          </span>
        </header>

        {/* Setup checklist — both steps completed */}
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
            <span className="line-through">Create your chef profile</span>
            <span className="ml-3 inline-block h-3 w-3 rounded-full bg-emerald-500" />
            <span className="line-through">Publish a menu</span>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {/* New incoming request — slides in */}
          <li
            className="rounded-md border p-4 transition-all duration-700"
            style={{
              opacity: newRequestVisible ? 1 : 0,
              transform: newRequestVisible
                ? "translateY(0) scale(1)"
                : "translateY(-12px) scale(0.98)",
              borderColor: newRequestVisible
                ? "rgb(251 191 36)"
                : "rgb(39 39 42)",
              background: "rgb(24 24 27)",
            }}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">Hana Customer</h2>
              <span className="inline-flex items-center rounded-full border border-amber-800 bg-amber-950 px-2 py-0.5 text-xs font-medium capitalize text-amber-200">
                pending
              </span>
              {newRequestVisible && (
                <span className="text-xs text-amber-400">• new</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-zinc-400">
              <span>{chef.menu.name}</span>
              <span>·</span>
              <span>May 8, 2026 · 7:00 PM</span>
              <span>·</span>
              <span>6 guests</span>
              <span>·</span>
              <span className="tabular-nums">
                {formatPrice(chef.menu.price_per_person_cents * 6)}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              432 Noe St, San Francisco, CA
            </div>
          </li>

          {/* Older completed booking for context */}
          <li className="rounded-md border border-zinc-800 bg-zinc-900 p-4 opacity-70">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">Taro Customer</h2>
              <span className="inline-flex items-center rounded-full border border-sky-800 bg-sky-950 px-2 py-0.5 text-xs font-medium capitalize text-sky-200">
                completed
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-zinc-400">
              <span>{chef.menu.name}</span>
              <span>·</span>
              <span>Apr 3, 2026 · 6:30 PM</span>
              <span>·</span>
              <span>4 guests</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
