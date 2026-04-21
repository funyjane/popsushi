"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  chefId: string;
  menuId: string;
  menuName: string;
  priceCents: number;
  currency: string;
  minGuests: number;
  maxGuests: number;
  defaults: { lat: number; lng: number; address: string; guests: number };
};

// 24 hours in the future, rounded up to the next whole hour. Gives a sane
// default that also satisfies the RPC's "event must be in the future" check.
function defaultEventAtLocal(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minEventAtLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // at least 1 hour out
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookForm({
  chefId,
  menuId,
  menuName,
  priceCents,
  currency,
  minGuests,
  maxGuests,
  defaults,
}: Props) {
  const router = useRouter();

  const schema = useMemo(
    () =>
      z.object({
        event_at: z
          .string()
          .min(1, "Pick a date and time")
          .refine(
            (v) => {
              const d = new Date(v);
              return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
            },
            { message: "Event must be in the future" },
          ),
        guest_count: z.coerce
          .number()
          .int()
          .min(minGuests, `This menu requires at least ${minGuests} guests`)
          .max(maxGuests, `This menu caps at ${maxGuests} guests`),
        address: z.string().min(3, "Address is required"),
        notes: z.string().max(1000).optional(),
      }),
    [minGuests, maxGuests],
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      event_at: defaultEventAtLocal(),
      guest_count: defaults.guests,
      address: defaults.address,
      notes: "",
    },
  });

  const guestCount = Number(watch("guest_count") || 0);
  const liveTotal = Number.isFinite(guestCount) ? priceCents * guestCount : 0;

  async function onSubmit(values: Values) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("create_booking", {
      p_chef_id: chefId,
      p_menu_id: menuId,
      p_event_at: new Date(values.event_at).toISOString(),
      p_guest_count: values.guest_count,
      p_lat: defaults.lat,
      p_lng: defaults.lng,
      p_event_address: values.address,
      p_notes: values.notes ?? "",
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    router.replace(`/bookings/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Event date & time" error={errors.event_at?.message}>
        <input
          type="datetime-local"
          min={minEventAtLocal()}
          className="input"
          {...register("event_at")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <Field
          label="Guests"
          error={errors.guest_count?.message}
          hint={`${minGuests}–${maxGuests}`}
        >
          <input
            type="number"
            min={minGuests}
            max={maxGuests}
            className="input"
            {...register("guest_count")}
          />
        </Field>
        <Field label="Event address" error={errors.address?.message}>
          <input
            className="input"
            autoComplete="street-address"
            {...register("address")}
          />
        </Field>
      </div>

      <Field
        label="Notes for the chef (optional)"
        error={errors.notes?.message}
      >
        <textarea
          rows={4}
          className="input"
          placeholder="Dietary needs, kitchen notes, occasion..."
          {...register("notes")}
        />
      </Field>

      <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">{menuName}</span>
          <span className="tabular-nums">
            {formatPrice(priceCents, currency)} × {guestCount || 0}
          </span>
        </div>
        <div className="flex items-baseline justify-between font-medium">
          <span>Estimated total</span>
          <span className="tabular-nums">
            {formatPrice(liveTotal, currency)}
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          Price is locked at request time. The chef still needs to accept.
        </p>
      </div>

      {errors.root && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Submitting..." : "Request booking"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-baseline justify-between">
        <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </span>
      {children}
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </label>
  );
}

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(0)} ${currency}`;
  }
}
