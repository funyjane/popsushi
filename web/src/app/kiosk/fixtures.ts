import type { ChefDemo } from "@/components/kiosk/types";

// Hardcoded chef data matching web/scripts/seed.ts. The kiosk is fully offline —
// no Supabase call — so a stuck DB never locks the demo screen. Update these if
// the seed changes meaningfully.
export const FALLBACK_CHEFS: ChefDemo[] = [
  {
    id: "chef-tanaka",
    display_name: "Chef Tanaka",
    base_address: "Japantown, San Francisco, CA",
    years_experience: 15,
    avg_rating: 5.0,
    review_count: 12,
    distance_km: 3.4,
    bio: "15 years at Sushi Zo Tokyo then LA. I run a counter-style omakase at your table — knives, cutting board, and Tsukiji-trained rice come with me.",
    lat: 37.7852,
    lng: -122.4299,
    menu: {
      id: "menu-tanaka",
      name: "Edomae omakase · 14 courses",
      description:
        "14 courses of nigiri, one tsumami, and two hand-rolls to finish. Hand-formed to order. I source bluefin from Honolulu, uni from Santa Barbara, and aged rice vinegar from Iio Jozo.",
      price_per_person_cents: 22000,
      currency: "USD",
      min_guests: 2,
      max_guests: 8,
    },
  },
  {
    id: "chef-yamada",
    display_name: "Chef Yamada",
    base_address: "Mission District, San Francisco, CA",
    years_experience: 8,
    avg_rating: 4.6,
    review_count: 24,
    distance_km: 1.1,
    bio: "Former line cook at State Bird Provisions turned sushi chef. Relaxed family-style service — great for dinner parties with kids underfoot.",
    lat: 37.7599,
    lng: -122.4148,
    menu: {
      id: "menu-yamada",
      name: "Family-style sushi night",
      description:
        "A shared-platter service designed for larger groups. Rolls, nigiri, crispy rice, gyoza to start, miso to finish.",
      price_per_person_cents: 13500,
      currency: "USD",
      min_guests: 4,
      max_guests: 12,
    },
  },
  {
    id: "chef-sato",
    display_name: "Chef Sato",
    base_address: "Rockridge, Oakland, CA",
    years_experience: 6,
    avg_rating: 4.8,
    review_count: 9,
    distance_km: 12.7,
    bio: "East Bay based. I specialize in intimate 2-person anniversaries and date nights — tasting menus built around whatever's best at the Berkeley Bowl that morning.",
    lat: 37.8443,
    lng: -122.2515,
    menu: {
      id: "menu-sato",
      name: "Seasonal tasting · 9 courses",
      description:
        "Nine courses, built around the season and what I find at market. Typically five nigiri, two tsumami, one temaki, one dessert.",
      price_per_person_cents: 17500,
      currency: "USD",
      min_guests: 2,
      max_guests: 6,
    },
  },
];

export function formatPrice(cents: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}
