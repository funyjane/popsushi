"use client";

export function KioskProgress({
  index,
  total,
  sceneDurationMs,
  sceneKey,
}: {
  index: number;
  total: number;
  sceneDurationMs: number;
  sceneKey: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-6 pb-4">
      <div className="h-1 w-full max-w-3xl overflow-hidden rounded-full bg-white/10">
        <div
          key={sceneKey}
          className="h-full bg-white/80"
          style={{
            animation: `kiosk-progress ${sceneDurationMs}ms linear forwards`,
          }}
        />
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Scene {index + 1} of {total} · PopSushi demo
      </div>
    </div>
  );
}
