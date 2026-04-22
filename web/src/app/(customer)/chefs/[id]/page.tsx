import Link from "next/link";
import { notFound } from "next/navigation";
import { StarRating } from "@/components/star-rating";
import { formatPrice, formatRelative } from "@/lib/format";
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

  const [chefRes, menuRes, reviewsRes] = await Promise.all([
    supabase
      .from("chef_profiles")
      .select(
        "profile_id, bio, base_address, years_experience, avg_rating, review_count, is_active, profiles!inner(display_name, avatar_path, role)",
      )
      .eq("profile_id", id)
      .maybeSingle(),
    supabase
      .from("menus")
      .select(
        "id, name, description, price_per_person_cents, currency, min_guests, max_guests, is_published",
      )
      .eq("chef_id", id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select(
        "booking_id, rating, comment, created_at, profiles!reviews_customer_id_fkey!inner(display_name)",
      )
      .eq("chef_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const chef = chefRes.data;
  const menu = menuRes.data;
  const reviews = reviewsRes.data ?? [];

  if (!chef || (chef.profiles as { role: string }).role !== "chef") {
    notFound();
  }

  const profile = chef.profiles as {
    display_name: string;
    avatar_path: string | null;
  };

  const bookHref = (() => {
    if (!menu) return null;
    const qs = new URLSearchParams({ chef_id: id, menu_id: menu.id });
    for (const k of ["lat", "lng", "address", "guests"] as const) {
      const v = sp[k];
      if (typeof v === "string") qs.set(k, v);
    }
    return `/book?${qs.toString()}`;
  })();

  const avg = chef.avg_rating ? Number(chef.avg_rating) : null;

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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {avg !== null && (
              <StarRating
                value={avg}
                size="sm"
                showValue
                reviewCount={chef.review_count ?? 0}
              />
            )}
            <span>{chef.base_address}</span>
            {chef.years_experience ? (
              <span>· {chef.years_experience} years experience</span>
            ) : null}
            {!chef.is_active && (
              <span>· not currently taking bookings</span>
            )}
          </div>
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

          <div className="mt-2">
            {bookHref && chef.is_active ? (
              <Link href={bookHref} className="btn-primary">
                Request booking
              </Link>
            ) : (
              <button type="button" className="btn-primary" disabled>
                {chef.is_active ? "Request booking" : "Not taking bookings"}
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
          This chef hasn't published a menu yet.
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No reviews yet — be the first once the chef cooks for you.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => {
              const author = (r.profiles as { display_name: string })
                .display_name;
              return (
                <li
                  key={r.booking_id}
                  className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{author}</span>
                      <StarRating value={r.rating} size="sm" />
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatRelative(r.created_at)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {r.comment}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
