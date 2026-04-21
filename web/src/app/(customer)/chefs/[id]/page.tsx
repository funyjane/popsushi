import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChefDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();

  // Chef profile + joined display_name / avatar in one roundtrip.
  const { data: chef } = await supabase
    .from("chef_profiles")
    .select(
      "profile_id, bio, base_address, years_experience, avg_rating, review_count, is_active, profiles!inner(display_name, avatar_path, role)",
    )
    .eq("profile_id", id)
    .maybeSingle();

  if (!chef || (chef.profiles as { role: string }).role !== "chef") {
    notFound();
  }

  const { data: menu } = await supabase
    .from("menus")
    .select(
      "id, name, description, price_per_person_cents, currency, min_guests, max_guests, is_published",
    )
    .eq("chef_id", id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const profile = chef.profiles as { display_name: string; avatar_path: string | null };

  const bookHref = (() => {
    if (!menu) return null;
    const qs = new URLSearchParams({ chef_id: id, menu_id: menu.id });
    for (const k of ["lat", "lng", "address", "guests"] as const) {
      const v = sp[k];
      if (typeof v === "string") qs.set(k, v);
    }
    return `/book?${qs.toString()}`;
  })();

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link href="/search" className="text-sm text-zinc-500 hover:underline">
          ← Back to search
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile.display_name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {chef.base_address}
            {chef.years_experience
              ? ` · ${chef.years_experience} years experience`
              : ""}
            {!chef.is_active && " · not currently taking bookings"}
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          About
        </h2>
        <p className="whitespace-pre-line text-base leading-relaxed">
          {chef.bio}
        </p>
      </section>

      {menu ? (
        <section className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight">{menu.name}</h2>
            <p className="text-sm text-zinc-500">
              {formatPrice(menu.price_per_person_cents, menu.currency)} / person
              · {menu.min_guests}–{menu.max_guests} guests
            </p>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {menu.description}
          </p>

          <div className="mt-2 flex items-center gap-3">
            {bookHref && chef.is_active ? (
              <Link href={bookHref} className="btn-primary">
                Request booking
              </Link>
            ) : (
              <button type="button" className="btn-primary" disabled>
                {chef.is_active ? "Request booking" : "Not taking bookings"}
              </button>
            )}
            <span className="text-xs text-zinc-500">
              Booking flow lands in Phase 4 — this link reserves the shape.
            </span>
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
          This chef hasn't published a menu yet.
        </section>
      )}
    </article>
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
