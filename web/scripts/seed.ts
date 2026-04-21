/**
 * Idempotent seed script. Creates fake customers + chefs via the GoTrue admin
 * API with pre-confirmed emails. Phase 2 will extend this to upload chef
 * photos and create chef_profiles + menus.
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

type SeedUser = {
  email: string;
  password: string;
  role: "customer" | "chef";
  display_name: string;
};

const SEED_USERS: SeedUser[] = [
  { email: "hana@popsushi.local", password: "password123", role: "customer", display_name: "Hana Customer" },
  { email: "taro@popsushi.local", password: "password123", role: "customer", display_name: "Taro Customer" },
  { email: "tanaka@popsushi.local", password: "password123", role: "chef", display_name: "Chef Tanaka" },
  { email: "yamada@popsushi.local", password: "password123", role: "chef", display_name: "Chef Yamada" },
  { email: "sato@popsushi.local", password: "password123", role: "chef", display_name: "Chef Sato" },
];

async function ensureUser(u: SeedUser) {
  // listUsers paginates; for <1000 users per email, one page is enough.
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

async function main() {
  console.log(`Seeding against ${SUPABASE_URL} ...`);
  for (const u of SEED_USERS) {
    try {
      await ensureUser(u);
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
