"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AddressPicker } from "@/components/address-picker";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type ChefProfileDefaults = {
  bio: string;
  base_address: string;
  lat: number | null;
  lng: number | null;
  service_radius_km: number;
  years_experience: number | null;
  is_active: boolean;
};

const schema = z.object({
  bio: z.string().min(10, "Say at least a sentence about yourself").max(1000),
  base_address: z.string().min(3, "Address is required"),
  lat: z.number({ invalid_type_error: "Drop a pin on the map" }),
  lng: z.number({ invalid_type_error: "Drop a pin on the map" }),
  service_radius_km: z.coerce.number().int().min(1).max(200),
  years_experience: z.union([
    z.coerce.number().int().min(0).max(80),
    z.nan(),
  ]).transform((v) => (Number.isNaN(v) ? null : v)),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function ChefProfileForm({
  defaults,
  isNew,
}: {
  defaults: ChefProfileDefaults;
  isNew: boolean;
}) {
  const router = useRouter();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: defaults.bio,
      base_address: defaults.base_address,
      lat: defaults.lat ?? (undefined as unknown as number),
      lng: defaults.lng ?? (undefined as unknown as number),
      service_radius_km: defaults.service_radius_km,
      years_experience: defaults.years_experience ?? (undefined as unknown as number),
      is_active: defaults.is_active,
    },
  });

  async function onSubmit(values: FormValues) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("upsert_my_chef_profile", {
      p_bio: values.bio,
      p_base_address: values.base_address,
      p_lat: values.lat,
      p_lng: values.lng,
      p_service_radius_km: values.service_radius_km,
      p_years_experience: values.years_experience,
      p_is_active: values.is_active,
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Short bio" error={errors.bio?.message}>
        <textarea
          rows={4}
          className="input"
          placeholder="e.g. Trained at Sushi Zo, 8 years on the omakase line. I bring a small cutting board and all knives..."
          {...register("bio")}
        />
      </Field>

      <Controller
        control={control}
        name="lat"
        render={({ field: latField, fieldState: latState }) => (
          <Controller
            control={control}
            name="lng"
            render={({ field: lngField }) => (
              <Controller
                control={control}
                name="base_address"
                render={({
                  field: addrField,
                  fieldState: addrState,
                }) => (
                  <AddressPicker
                    value={
                      typeof latField.value === "number" &&
                      typeof lngField.value === "number"
                        ? { lat: latField.value, lng: lngField.value }
                        : null
                    }
                    onChange={(v) => {
                      latField.onChange(v.lat);
                      lngField.onChange(v.lng);
                    }}
                    addressValue={addrField.value ?? ""}
                    onAddressChange={addrField.onChange}
                    addressError={
                      addrState.error?.message ?? latState.error?.message
                    }
                  />
                )}
              />
            )}
          />
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Service radius (km)"
          error={errors.service_radius_km?.message}
          hint="1–200"
        >
          <input
            type="number"
            min={1}
            max={200}
            className="input"
            {...register("service_radius_km")}
          />
        </Field>
        <Field
          label="Years experience"
          error={errors.years_experience?.message}
          hint="Optional"
        >
          <input
            type="number"
            min={0}
            max={80}
            className="input"
            {...register("years_experience")}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is_active")} />
        <span>Accepting bookings</span>
      </label>

      {errors.root && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Saving..." : isNew ? "Create profile" : "Save changes"}
        </button>
        {savedAt && (
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            Saved.
          </span>
        )}
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
