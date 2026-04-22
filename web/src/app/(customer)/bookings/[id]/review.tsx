"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating, StarRatingInput } from "@/components/star-rating";
import { formatRelative } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Existing = {
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
} | null;

type Props = {
  bookingId: string;
  chefName: string;
  existing: Existing;
};

export function CustomerReviewSection({ bookingId, chefName, existing }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(!existing);
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [comment, setComment] = useState<string>(existing?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Pick a rating");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("upsert_review", {
      p_booking_id: bookingId,
      p_rating: rating,
      p_comment: comment,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (existing && !editing) {
    const edited =
      existing.updated_at && existing.updated_at !== existing.created_at;
    return (
      <section className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs uppercase tracking-wide text-zinc-500">
              Your review
            </h2>
            <StarRating value={existing.rating} size="sm" />
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs underline"
          >
            Edit
          </button>
        </div>
        {existing.comment && (
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {existing.comment}
          </p>
        )}
        <p className="text-xs text-zinc-500">
          {edited ? "Updated" : "Posted"} {formatRelative(existing.updated_at)}
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold">
        {existing ? "Edit your review" : `How was your dinner with ${chefName}?`}
      </h2>
      <StarRatingInput value={rating} onChange={setRating} disabled={busy} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          Comment{" "}
          <span className="text-xs text-zinc-500">(optional, up to 2000)</span>
        </span>
        <textarea
          rows={4}
          className="input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What stood out? Anything future customers should know?"
          maxLength={2000}
          disabled={busy}
        />
      </label>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving..." : existing ? "Save changes" : "Post review"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setRating(existing.rating);
              setComment(existing.comment ?? "");
              setError(null);
            }}
            disabled={busy}
            className="text-sm underline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
