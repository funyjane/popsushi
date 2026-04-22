"use client";

import { useEffect, useState } from "react";
import type { SceneProps } from "../types";

export function SceneReview({ chefs, isActive }: SceneProps) {
  const chef = chefs.find((c) => c.id === "chef-tanaka") ?? chefs[0];
  const [interstitial, setInterstitial] = useState(true);
  const [filledStars, setFilledStars] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setInterstitial(true);
      setFilledStars(0);
      setSubmitted(false);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setInterstitial(false), 1600));
    // Click 5 stars in sequence
    [1, 2, 3, 4, 5].forEach((n, i) => {
      timers.push(setTimeout(() => setFilledStars(n), 2400 + i * 350));
    });
    timers.push(setTimeout(() => setSubmitted(true), 5400));
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [isActive]);

  return (
    <div className="relative h-full w-full">
      {/* Time-jump interstitial */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950 transition-opacity duration-700"
        style={{
          opacity: interstitial ? 1 : 0,
          pointerEvents: interstitial ? "auto" : "none",
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            After the event
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">
            How was it?
          </h2>
        </div>
      </div>

      <article className="mx-auto flex h-full max-w-2xl flex-col gap-5 px-8 py-10 text-zinc-100">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Leave a review
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            for {chef.display_name} · {chef.menu.name}
          </p>
        </header>

        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Your rating
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className="text-4xl leading-none transition-all duration-300"
                style={{
                  color: n <= filledStars ? "rgb(245 158 11)" : "rgb(63 63 70)",
                  transform:
                    n === filledStars ? "scale(1.25)" : "scale(1)",
                }}
              >
                ★
              </span>
            ))}
            <span className="ml-3 text-xs tabular-nums text-zinc-500">
              {filledStars > 0 ? `${filledStars}/5` : ""}
            </span>
          </div>

          <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Comment (optional)
          </div>
          <div className="mt-1 min-h-16 rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm leading-relaxed text-zinc-200">
            {filledStars >= 5
              ? "Unreal night. Tanaka turned our dining room into a Tokyo counter. Worth every penny."
              : " "}
          </div>

          <div className="mt-5">
            {!submitted ? (
              <div
                className="inline-flex rounded-md bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-all"
                style={{
                  opacity: filledStars > 0 ? 1 : 0.5,
                }}
              >
                Submit review
              </div>
            ) : (
              <div className="inline-flex rounded-md border border-emerald-800 bg-emerald-950 px-4 py-2.5 text-sm font-medium text-emerald-200">
                ✓ Thanks — review submitted
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
