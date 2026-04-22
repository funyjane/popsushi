"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KioskCaption } from "@/components/kiosk/kiosk-caption";
import { KioskCursor } from "@/components/kiosk/kiosk-cursor";
import { KioskProgress } from "@/components/kiosk/kiosk-progress";
import { KIOSK_SCENES } from "@/components/kiosk/scenes";
import type { ChefDemo } from "@/components/kiosk/types";
import {
  useCursorScript,
  useKioskTimeline,
} from "@/components/kiosk/use-kiosk-timeline";

export function KioskPlayer({ chefs }: { chefs: ChefDemo[] }) {
  const router = useRouter();
  const { index, scene } = useKioskTimeline(KIOSK_SCENES);
  const cursor = useCursorScript(scene.cursorScript, true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const SceneComponent = scene.Component;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-950 text-zinc-100"
      aria-label="PopSushi product demo"
    >
      {/* Scene container. Re-mounts scene via key so each scene's
          setTimeout-driven state starts from scratch. */}
      <div key={scene.id} className="kiosk-scene-fade relative h-full w-full">
        <SceneComponent chefs={chefs} isActive={true} />
      </div>

      <KioskCursor pos={cursor} />
      <KioskCaption text={scene.caption} sceneKey={scene.id} />
      <KioskProgress
        index={index}
        total={KIOSK_SCENES.length}
        sceneDurationMs={scene.durationMs}
        sceneKey={scene.id}
      />

      <button
        type="button"
        onClick={() => router.push("/")}
        className="fixed right-4 top-4 z-50 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md hover:bg-black/60 hover:text-white"
        aria-label="Exit demo"
      >
        Exit
      </button>

      <KioskStyles />
    </div>
  );
}

function KioskStyles() {
  return (
    <style>{`
      /* Shared kiosk pin/input styles. */
      .chef-pin-kiosk {
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        background: white;
        border: 2px solid rgb(24 24 27);
        font-size: 17px;
        line-height: 30px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }
      .kiosk-customer-pin {
        font-size: 28px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
      }
      .kiosk-input {
        border-radius: 0.375rem;
        border: 1px solid rgb(63 63 70);
        background: rgb(9 9 11);
        color: rgb(161 161 170);
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        min-height: 2.4rem;
      }

      /* Typing caret blink. */
      .kiosk-caret {
        display: inline-block;
        margin-left: 1px;
        color: rgb(244 244 245);
        animation: kiosk-blink 1s step-end infinite;
      }
      @keyframes kiosk-blink {
        50% { opacity: 0; }
      }

      /* Numeric counter pulse on change. */
      .kiosk-counter {
        display: inline-block;
        animation: kiosk-pulse 400ms ease-out;
      }
      @keyframes kiosk-pulse {
        0%   { transform: scale(1.18); color: rgb(245 158 11); }
        100% { transform: scale(1);    color: inherit; }
      }

      /* Cursor click ripple. */
      .kiosk-cursor-click path {
        animation: kiosk-cursor-scale 300ms ease-out;
      }
      @keyframes kiosk-cursor-scale {
        0%   { transform: scale(1); transform-origin: 4px 4px; }
        50%  { transform: scale(0.85); transform-origin: 4px 4px; }
        100% { transform: scale(1); transform-origin: 4px 4px; }
      }
      .kiosk-cursor-ripple {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        border: 2px solid rgba(255,255,255,0.9);
        animation: kiosk-ripple 420ms ease-out forwards;
      }
      @keyframes kiosk-ripple {
        0%   { transform: scale(1); opacity: 0.9; }
        100% { transform: scale(4); opacity: 0; }
      }

      /* Highlight primary CTAs so the eye knows where the cursor is headed. */
      .kiosk-cta-highlight {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
        animation: kiosk-cta-pulse 1.8s ease-in-out infinite;
      }
      @keyframes kiosk-cta-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
        50%      { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
      }

      /* Scene fade-in. */
      .kiosk-scene-fade {
        animation: kiosk-scene-fade 550ms ease-out;
      }
      @keyframes kiosk-scene-fade {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Caption fade-in. */
      .kiosk-caption {
        animation: kiosk-caption-in 500ms ease-out;
      }
      @keyframes kiosk-caption-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Scene progress bar. */
      @keyframes kiosk-progress {
        from { width: 0%; }
        to   { width: 100%; }
      }
    `}</style>
  );
}
