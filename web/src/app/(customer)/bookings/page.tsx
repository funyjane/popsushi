export default function CustomerBookingsPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        No bookings yet. Head to <a className="underline" href="/search">Find a chef</a> to start one. (Search UI ships in Phase 3.)
      </p>
      <div className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        Phase 1 placeholder — real booking list lands in Phase 4.
      </div>
    </section>
  );
}
