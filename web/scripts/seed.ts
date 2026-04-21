/**
 * Idempotent seed script. Creates fake customers + chefs via the GoTrue admin
 * API, then populates chef_profiles + one published menu per chef.
 *
 * Run from the host:
 *   docker compose exec web pnpm run seed
 * or from inside the web container:
 *   pnpm run seed
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "seed: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
      "Run via `docker compose exec web pnpm run seed` so the container env is present.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ChefSeed = {
  bio: string;
  base_address: string;
  lat: number;
  lng: number;
  service_radius_km: number;
  years_experience: number;
  menu: {
    name: string;
    description: string;
    price_per_person_cents: number;
    min_guests: number;
    max_guests: number;
  };
};

type SeedUser = {
  email: string;
  password: string;
  role: "customer" | "chef";
  display_name: string;
  chef?: ChefSeed;
};

// SF Bay Area coordinates — deterministic so search results are predictable.
const SEED_USERS: SeedUser[] = [
  { email: "hana@popsushi.local", password: "password123", role: "customer", display_name: "Hana Customer" },
  { email: "taro@popsushi.local", password: "password123", role: "customer", display_name: "Taro Customer" },
  {
    email: "tanaka@popsushi.local",
    password: "password123",
    role: "chef",
    display_name: "Chef Tanaka",
    chef: {
      bio: "15 years at Sushi Zo Tokyo then LA. I run a counter-style omakase at your table — knives, cutting board, and Tsukiji-trained rice come with me.",
      base_address: "Japantown, San Francisco, CA",
      lat: 37.7852,
      lng: -122.4299,
      service_radius_km: 40,
      years_experience: 15,
      menu: {
        name: "Edomae omakase · 14 courses",
        description:
          "14 courses of nigiri, one tsumami, and two hand-rolls to finish. Hand-formed to order. I source bluefin from Honolulu, uni from Santa Barbara, and aged rice vinegar from Iio Jozo. Wine / sake pairings can be arranged on request.",
        price_per_person_cents: 22000,
        min_guests: 2,
        max_guests: 8,
      },
    },
  },
  {
    email: "yamada@popsushi.local",
    password: "password123",
    role: "chef",
    display_name: "Chef Yamada",
    chef: {
      bio: "Former line cook at State Bird Provisions turned sushi chef. Relaxed family-style service — great for dinner parties with kids underfoot.",
      base_address: "Mission District, San Francisco, CA",
      lat: 37.7599,
      lng: -122.4148,
      service_radius_km: 25,
      years_experience: 8,
      menu: {
        name: "Family-style sushi night",
        description:
          "A shared-platter service designed for larger groups. Rolls, nigiri, crispy rice, gyoza to start, miso to finish. Less formal than omakase, more food per head. Dietary swaps easy — just ask.",
        price_per_person_cents: 13500,
        min_guests: 4,
        max_guests: 12,
      },
    },
  },
  {
    email: "sato@popsushi.local",
    password: "password123",
    role: "chef",
    display_name: "Chef Sato",
    chef: {
      bio: "East Bay based. I specialize in intimate 2-person anniversaries and date nights — tasting menus built around whatever's best at the Berkeley Bowl that morning.",
      base_address: "Rockridge, Oakland, CA",
      lat: 37.8443,
      lng: -122.2515,
      service_radius_km: 30,
      years_experience: 6,
      menu: {
        name: "Seasonal tasting · 9 courses",
        description:
          "Nine courses, built around the season and what I find at market. Typically five nigiri, two tsumami, one temaki, one dessert. Text me the day before if there's anything you want to skip or double down on.",
        price_per_person_cents: 17500,
        min_guests: 2,
        max_guests: 6,
      },
    },
  },
];

async function ensureUser(u: SeedUser) {
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const existing = listData.users.find((x) => x.email === u.email);

  if (existing) {
    console.log(`= ${u.email} (already exists, id=${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { role: u.role, display_name: u.display_name },
  });
  if (error) throw error;
  if (!data.user) throw new Error(`createUser returned no user for ${u.email}`);
  console.log(`+ ${u.email} (${u.role}) — id=${data.user.id}`);
  return data.user.id;
}

async function ensureChefProfile(userId: string, chef: ChefSeed) {
  // Service role client bypasses RLS, so we can write geography directly
  // via the canonical EWKT form. Going through the RPC would require a
  // user JWT; the service role insert is simpler here.
  const { error } = await admin
    .from("chef_profiles")
    .upsert(
      {
        profile_id: userId,
        bio: chef.bio,
        base_address: chef.base_address,
        base_location: `SRID=4326;POINT(${chef.lng} ${chef.lat})`,
        service_radius_km: chef.service_radius_km,
        years_experience: chef.years_experience,
        is_active: true,
      },
      { onConflict: "profile_id" },
    );
  if (error) throw new Error(`chef_profile ${userId}: ${error.message}`);
}

async function ensureMenu(userId: string, chef: ChefSeed) {
  // One menu per chef in MVP. Find the existing one by (chef_id, name) so
  // re-runs don't stack duplicates.
  const { data: existing, error: selErr } = await admin
    .from("menus")
    .select("id")
    .eq("chef_id", userId)
    .eq("name", chef.menu.name)
    .maybeSingle();
  if (selErr) throw selErr;

  const payload = {
    chef_id: userId,
    name: chef.menu.name,
    description: chef.menu.description,
    price_per_person_cents: chef.menu.price_per_person_cents,
    currency: "USD",
    min_guests: chef.menu.min_guests,
    max_guests: chef.menu.max_guests,
    is_published: true,
  };

  if (existing) {
    const { error } = await admin.from("menus").update(payload).eq("id", existing.id);
    if (error) throw new Error(`menu ${userId}: ${error.message}`);
    return;
  }
  const { error } = await admin.from("menus").insert(payload);
  if (error) throw new Error(`menu ${userId}: ${error.message}`);
}

async function main() {
  console.log(`Seeding against ${SUPABASE_URL} ...`);
  for (const u of SEED_USERS) {
    try {
      const id = await ensureUser(u);
      if (u.chef) {
        await ensureChefProfile(id, u.chef);
        await ensureMenu(id, u.chef);
        console.log(`  · chef_profile + menu ready for ${u.email}`);
      }
    } catch (e) {
      console.error(`! ${u.email}:`, e instanceof Error ? e.message : e);
      process.exitCode = 1;
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
