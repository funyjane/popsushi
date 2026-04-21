"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type MenuDefaults = {
  id: string | null;
  name: string;
  description: string;
  price_per_person_dollars: number;
  currency: string;
  min_guests: number;
  max_guests: number;
  is_published: boolean;
};

const schema = z
  .object({
    name: z.string().min(2, "Give your menu a name").max(120),
    description: z
      .string()
      .min(20, "A few sentences help customers decide")
      .max(2000),
    price_per_person_dollars: z.coerce
      .number()
      .positive("Must be positive")
      .max(10_000),
    min_guests: z.coerce.number().int().min(1),
    max_guests: z.coerce.number().int().min(1),
    is_published: z.boolean(),
  })
  .refine((v) => v.max_guests >= v.min_guests, {
    path: ["max_guests"],
    message: "Max must be ≥ min",
  });
type FormValues = z.infer<typeof schema>;

export function ChefMenuForm({
  defaults,
  chefId,
}: {
  defaults: MenuDefaults;
  chefId: string;
}) {
  const router = useRouter();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaults.name,
      description: defaults.description,
      price_per_person_dollars: defaults.price_per_person_dollars,
      min_guests: defaults.min_guests,
      max_guests: defaults.max_guests,
      is_published: defaults.is_published,
    },
  });

  async function onSubmit(values: FormValues) {
    const supabase = createSupabaseBrowserClient();
    const payload = {
      chef_id: chefId,
      name: values.name,
      description: values.description,
      price_per_person_cents: Math.round(values.price_per_person_dollars * 100),
      currency: defaults.currency,
      min_guests: values.min_guests,
      max_guests: values.max_guests,
      is_published: values.is_published,
    };

    const { error } = defaults.id
      ? await supabase.from("menus").update(payload).eq("id", defaults.id)
      : await supabase.from("menus").insert(payload);

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Menu name" error={errors.name?.message}>
        <input
          className="input"
          placeholder="e.g. Omakase at home — 12 courses"
          {...register("name")}
        />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <textarea
          rows={6}
          className="input"
          placeholder="What's on the menu, sourcing, format (counter-style vs family-style), what you bring, what you need from the host..."
          {...register("description")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label={`Price per person (${defaults.currency})`}
          error={errors.price_per_person_dollars?.message}
        >
          <input
            type="number"
            step="0.01"
            min={1}
            className="input"
            {...register("price_per_person_dollars")}
          />
        </Field>
        <Field label="Min guests" error={errors.min_guests?.message}>
          <input
            type="number"
            min={1}
            className="input"
            {...register("min_guests")}
          />
        </Field>
        <Field label="Max guests" error={errors.max_guests?.message}>
          <input
            type="number"
            min={1}
            className="input"
            {...register("max_guests")}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("is_published")} />
        <span>Publish menu (visible to customers)</span>
      </label>

      {errors.root && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Saving..." : defaults.id ? "Save changes" : "Create menu"}
        </button>
        {savedAt && (
          <span className="text-xs text-emerald-700 dark:text-emerald-400">Saved.</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </label>
  );
}
