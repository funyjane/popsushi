"use client";

import { useEffect, useState } from "react";
import type { SceneProps } from "../types";

export function SceneLoopCard({ isActive }: SceneProps) {
  const [countdown, setCountdown] = useState(3);
  useEffect(() => {
    if (!isActive) {
      setCountdown(3);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setCountdown(2), 1500));
    timers.push(setTimeout(() => setCountdown(1), 3000));
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [isActive]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center text-zinc-100">
      <h1 className="text-6xl font-semibold tracking-tight">
        <span aria-hidden>🍣 </span>PopSushi
      </h1>
      <p className="max-w-md text-lg text-zinc-400">
        Private sushi chefs. At your table. Booked in a few taps.
      </p>
      <div className="mt-4 rounded-full border border-zinc-800 bg-zinc-900 px-5 py-2 text-sm text-zinc-400">
        Replaying in{" "}
        <span key={countdown} className="kiosk-counter tabular-nums text-zinc-100">
          {countdown}
        </span>
        ...
      </div>
      <p className="mt-8 text-xs uppercase tracking-[0.3em] text-zinc-600">
        Built locally with Next.js + Supabase
      </p>
    </div>
  );
}
