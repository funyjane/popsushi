"use client";

export function KioskCaption({ text, sceneKey }: { text: string; sceneKey: string }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-6">
      <div
        key={sceneKey}
        className="kiosk-caption max-w-3xl rounded-xl border border-white/10 bg-black/70 px-6 py-3 text-center text-lg font-medium tracking-tight text-zinc-50 backdrop-blur-md"
        aria-live="polite"
      >
        {text}
      </div>
    </div>
  );
}
