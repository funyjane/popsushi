"use client";

import type { SceneProps } from "../types";

export function SceneLanding(_props: SceneProps) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col justify-center gap-8 px-6 py-16 text-zinc-100">
      <header className="space-y-3">
        <h1 className="text-5xl font-semibold tracking-tight">PopSushi</h1>
        <p className="text-lg text-zinc-400">
          Book a private sushi chef for your home or event.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 rounded-md bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900">
          Sign up
        </div>
        <div className="flex-1 rounded-md border border-zinc-700 px-4 py-3 text-center text-sm font-medium text-zinc-200">
          Log in
        </div>
      </div>

      <div className="mt-2 flex">
        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
          <span aria-hidden>▶</span> Watch demo
        </div>
      </div>
    </div>
  );
}
