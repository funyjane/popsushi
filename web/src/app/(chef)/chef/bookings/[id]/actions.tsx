"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Action = "accept" | "decline" | "cancel" | "complete";

type Props = { bookingId: string; status: string };

export function ChefBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");

  async function run(action: Action, payloadNote: string | null) {
    setPending(action);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("transition_booking", {
      p_booking_id: bookingId,
      p_action: action,
      p_note: payloadNote ?? null,
    });
    setPending(null);
    if (error) {
      setError(error.message);
      return;
    }
    setNote("");
    setReason("");
    router.refresh();
  }

  if (status === "pending") {
    return (
      <section className="flex flex-col gap-4 rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              Accept note{" "}
              <span className="text-xs text-zinc-500">(optional)</span>
            </span>
            <textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Confirm arrival time, parking, etc."
            />
          </label>
          <div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => run("accept", note)}
              disabled={pending !== null}
            >
              {pending === "accept" ? "Accepting..." : "Accept booking"}
            </button>
          </div>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              Decline reason{" "}
              <span className="text-xs text-zinc-500">(required)</span>
            </span>
            <textarea
              className="input"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Booked that evening already"
            />
          </label>
          <div>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => run("decline", reason)}
              disabled={pending !== null || reason.trim().length === 0}
            >
              {pending === "decline" ? "Declining..." : "Decline"}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </section>
    );
  }

  if (status === "accepted") {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (!confirm("Mark this booking as completed?")) return;
              run("complete", null);
            }}
            disabled={pending !== null}
          >
            {pending === "complete" ? "Marking..." : "Mark completed"}
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onClick={() => {
              if (!confirm("Cancel this booking?")) return;
              run("cancel", null);
            }}
            disabled={pending !== null}
          >
            {pending === "cancel" ? "Cancelling..." : "Cancel booking"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </section>
    );
  }

  return null;
}
