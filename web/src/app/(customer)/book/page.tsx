import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookForm } from "./form";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function qp(sp: Record<string, string | string[] | undefined>, k: string) {
  const v = sp[k];
  return typeof v === "string" ? v : undefined;
}

export default async function BookPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const chefId = qp(sp, "chef_id");
  const menuId = qp(sp, "menu_id");
  const lat = qp(sp, "lat");
  const lng = qp(sp, "lng");
  const address = qp(sp, "address") ?? "";
  const guests = qp(sp, "guests");

  if (!chefId || !menuId || !lat || !lng) {
    redirect("/search");
  }

  const supabase = await createSupabaseServerClient();

  // Chef + profile join and menu fetch in parallel. Both are publicly
  // readable under current RLS so this resolves for any authenticated
  // customer.
  const [chefRes, menuRes] = await Promise.all([
    supabase
      .from("chef_profiles")
      .select(
        "profile_id, base_address, is_active, profiles!inner(display_name, role)",
      )
      .eq("profile_id", chefId)
      .maybeSingle(),
    supabase
      .from("menus")
      .select(
        "id, name, description, price_per_person_cents, currency, min_guests, max_guests, is_published, chef_id",
      )
      .eq("id", menuId)
      .maybeSingle(),
  ]);

  const chef = chefRes.data;
  const menu = menuRes.data;

  if (!chef || !menu || menu.chef_id !== chefId || !menu.is_published) {
    notFound();
  }
  if (!chef.is_active) {
    // Chef isn't taking bookings — bounce to the detail page which shows why.
    redirect(`/chefs/${chefId}`);
  }

  const chefProfile = chef.profiles as { display_name: string };

  // Clamp the prefilled guest count into the menu's range so the form
  // starts in a valid state even if search used a different filter.
  const seedGuests = Math.min(
    Math.max(Number(guests) || menu.min_guests, menu.min_guests),
    menu.max_guests,
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href={`/chefs/${chefId}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to {chefProfile.display_name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Request a booking
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {chefProfile.display_name} · {menu.name} ·{" "}
          {formatPrice(menu.price_per_person_cents, menu.currency)} / person
        </p>
      </header>

      <BookForm
        chefId={chefId}
        menuId={menuId}
        menuName={menu.name}
        priceCents={menu.price_per_person_cents}
        currency={menu.currency}
        minGuests={menu.min_guests}
        maxGuests={menu.max_guests}
        defaults={{
          lat: Number(lat),
          lng: Number(lng),
          address,
          guests: seedGuests,
        }}
      />
    </section>
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
