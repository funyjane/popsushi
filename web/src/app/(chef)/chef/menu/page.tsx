import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChefMenuForm, type MenuDefaults } from "./form";

export const dynamic = "force-dynamic";

export default async function ChefMenuPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // requireRole in the layout guarantees a user + chef role; getUser is just
  // to scope the menu query.
  if (!user) return null;

  // Menu requires a chef_profile row (menus.chef_id FKs chef_profiles).
  const { data: chefProfile } = await supabase
    .from("chef_profiles")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!chefProfile) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your menu</h1>
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          Set up your{" "}
          <Link className="underline" href="/chef/profile">
            chef profile
          </Link>{" "}
          first — the menu is attached to it.
        </div>
      </section>
    );
  }

  // MVP: one active menu per chef. Grab the most recent (which is the one
  // the seed / form upserts).
  const { data: menu } = await supabase
    .from("menus")
    .select("id, name, description, price_per_person_cents, currency, min_guests, max_guests, is_published")
    .eq("chef_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const defaults: MenuDefaults = menu
    ? {
        id: menu.id,
        name: menu.name,
        description: menu.description,
        price_per_person_dollars: menu.price_per_person_cents / 100,
        currency: menu.currency,
        min_guests: menu.min_guests,
        max_guests: menu.max_guests,
        is_published: menu.is_published,
      }
    : {
        id: null,
        name: "",
        description: "",
        price_per_person_dollars: 120,
        currency: "USD",
        min_guests: 2,
        max_guests: 8,
        is_published: true,
      };

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your menu</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A single menu customers book against. Price is per person; guest
          range sets booking bounds.
        </p>
      </header>
      <ChefMenuForm defaults={defaults} chefId={user.id} />
    </section>
  );
}
