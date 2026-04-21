"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  display_name: z.string().min(1, "Required").max(80),
  role: z.enum(["customer", "chef"], {
    errorMap: () => ({ message: "Pick a role" }),
  }),
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [confirmSent, setConfirmSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  async function onSubmit(values: FormValues) {
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { role: values.role, display_name: values.display_name },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    // If GoTrue is configured with ENABLE_EMAIL_AUTOCONFIRM=true, the session
    // is returned immediately and we can route straight to the dashboard.
    // Otherwise the user must click the confirmation link in Inbucket.
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    setConfirmSent(values.email);
  }

  if (confirmSent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirm your email
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          We sent a confirmation link to <strong>{confirmSent}</strong>. In
          local dev, open{" "}
          <a
            className="underline"
            href="http://localhost:54324"
            target="_blank"
            rel="noreferrer"
          >
            Inbucket
          </a>{" "}
          to view it, click the link, then log in.
        </p>
        <Link href="/login" className="text-sm underline">
          Back to log in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create your PopSushi account
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Display name" error={errors.display_name?.message}>
          <input
            autoComplete="name"
            className="input"
            {...register("display_name")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className="input"
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            {...register("password")}
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-zinc-700 dark:text-zinc-300">
            I want to
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="customer" {...register("role")} />
            <span>Book chefs (customer)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="chef" {...register("role")} />
            <span>Cook for events (chef)</span>
          </label>
          {errors.role && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {errors.role.message}
            </span>
          )}
        </fieldset>

        {errors.root && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Signing up..." : "Sign up"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>

      <style>{`
        .input {
          display: block;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(212 212 216);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          color: rgb(24 24 27);
        }
        @media (prefers-color-scheme: dark) {
          .input {
            border-color: rgb(63 63 70);
            background: rgb(24 24 27);
            color: rgb(244 244 245);
          }
        }
      `}</style>
    </main>
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
