import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChefProfileForm, type ChefProfileDefaults } from "./form";

export const dynamic = "force-dynamic";

export default async function ChefProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_my_chef_profile").maybeSingle();

  const defaults: ChefProfileDefaults = data
    ? {
        bio: data.bio,
        base_address: data.base_address,
        lat: Number(data.lat),
        lng: Number(data.lng),
        service_radius_km: data.service_radius_km,
        years_experience: data.years_experience,
        is_active: data.is_active,
      }
    : {
        bio: "",
        base_address: "",
        lat: null,
        lng: null,
        service_radius_km: 25,
        years_experience: null,
        is_active: true,
      };

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your chef profile</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This is what customers see when they find you. Drop the pin where
          you're based — your service radius extends out from there.
        </p>
      </header>
      <ChefProfileForm defaults={defaults} isNew={!data} />
    </section>
  );
}
