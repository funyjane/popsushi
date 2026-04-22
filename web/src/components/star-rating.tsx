"use client";

import { useState } from "react";

type DisplayProps = {
  value: number; // 0-5, may be fractional
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
};

export function StarRating({
  value,
  size = "md",
  showValue = false,
  reviewCount,
}: DisplayProps) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const cls =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  return (
    <span
      className={`inline-flex items-center gap-1.5 align-middle ${cls}`}
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      <span className="relative inline-block leading-none" aria-hidden>
        <span className="text-zinc-300 dark:text-zinc-700">★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden text-amber-500"
          style={{ width: `${pct}%` }}
        >
          ★★★★★
        </span>
      </span>
      {showValue && (
        <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
          {value.toFixed(1)}
          {typeof reviewCount === "number" && (
            <span className="ml-1 text-zinc-500">
              ({reviewCount} review{reviewCount === 1 ? "" : "s"})
            </span>
          )}
        </span>
      )}
    </span>
  );
}

type EditableProps = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
};

export function StarRatingInput({ value, onChange, disabled }: EditableProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(n)}
            className={`text-2xl leading-none transition-colors disabled:opacity-60 ${
              filled ? "text-amber-500" : "text-zinc-300 dark:text-zinc-700"
            }`}
          >
            ★
          </button>
        );
      })}
      <span className="ml-2 text-xs tabular-nums text-zinc-500">
        {value > 0 ? `${value}/5` : ""}
      </span>
    </div>
  );
}
