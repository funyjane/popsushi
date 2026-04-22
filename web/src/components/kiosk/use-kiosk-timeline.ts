"use client";

import { useEffect, useRef, useState } from "react";
import type { CursorStep, SceneDefinition } from "./types";

export type TimelineState = {
  index: number;
  scene: SceneDefinition;
  loopCount: number;
};

export function useKioskTimeline(scenes: SceneDefinition[]): TimelineState {
  const [index, setIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);

  useEffect(() => {
    const scene = scenes[index];
    const id = setTimeout(() => {
      setIndex((i) => {
        const next = (i + 1) % scenes.length;
        if (next === 0) setLoopCount((c) => c + 1);
        return next;
      });
    }, scene.durationMs);
    return () => clearTimeout(id);
  }, [index, scenes]);

  return { index, scene: scenes[index], loopCount };
}

export type CursorPosition = { xPct: number; yPct: number; clicking: boolean };

export function useCursorScript(
  script: CursorStep[],
  isActive: boolean,
): CursorPosition {
  const [pos, setPos] = useState<CursorPosition>(() => ({
    xPct: script[0]?.xPct ?? 50,
    yPct: script[0]?.yPct ?? 50,
    clicking: false,
  }));

  useEffect(() => {
    if (!isActive) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const step of script) {
      timers.push(
        setTimeout(() => {
          setPos({ xPct: step.xPct, yPct: step.yPct, clicking: false });
        }, step.at),
      );
      if (step.action === "click") {
        timers.push(
          setTimeout(() => {
            setPos((p) => ({ ...p, clicking: true }));
          }, step.at + 600),
        );
        timers.push(
          setTimeout(() => {
            setPos((p) => ({ ...p, clicking: false }));
          }, step.at + 900),
        );
      }
    }
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [script, isActive]);

  return pos;
}

export function useTypewriter(
  text: string | undefined,
  {
    startDelay = 0,
    charMs = 55,
    active = true,
  }: { startDelay?: number; charMs?: number; active?: boolean } = {},
): string {
  const [shown, setShown] = useState("");
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!active || !text) {
      setShown("");
      return;
    }
    setShown("");
    let i = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          if (interval) clearInterval(interval);
        }
      }, charMs);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelay, charMs, active]);

  return shown;
}

export function useSceneClock(isActive: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      setElapsed(performance.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isActive]);
  return elapsed;
}
