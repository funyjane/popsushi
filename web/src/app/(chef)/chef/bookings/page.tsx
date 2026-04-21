export default function ChefBookingsPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Booking requests</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        No incoming requests yet.
      </p>
      <div className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        Phase 1 placeholder — real request list + Accept/Decline lands in Phase 4.
      </div>
    </section>
  );
}
