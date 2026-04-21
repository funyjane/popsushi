const CLASSES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800",
  accepted:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
  declined:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
  cancelled:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
  completed:
    "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border-sky-300 dark:border-sky-800",
};

export function BookingStatusBadge({ status }: { status: string }) {
  const cls = CLASSES[status] ?? CLASSES.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
