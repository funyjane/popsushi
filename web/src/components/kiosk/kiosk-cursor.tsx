"use client";

import type { CursorPosition } from "./use-kiosk-timeline";

export function KioskCursor({ pos }: { pos: CursorPosition }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50 transition-[left,top] duration-[650ms] ease-[cubic-bezier(.33,1,.68,1)]"
      style={{
        left: `${pos.xPct}%`,
        top: `${pos.yPct}%`,
        transform: "translate(-4px, -4px)",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={pos.clicking ? "kiosk-cursor-click" : ""}
        style={{
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))",
        }}
      >
        <path
          d="M3 2 L3 18 L7.5 13.5 L10.5 20 L13 19 L10 12.5 L16 12.5 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      {pos.clicking && (
        <span
          aria-hidden
          className="kiosk-cursor-ripple pointer-events-none absolute"
          style={{ left: 2, top: 2 }}
        />
      )}
    </div>
  );
}
