import type { ComponentType } from "react";

export type CursorAction = "move" | "click";

export type CursorStep = {
  at: number;
  xPct: number;
  yPct: number;
  action?: CursorAction;
};

export type ChefDemo = {
  id: string;
  display_name: string;
  base_address: string;
  years_experience: number;
  avg_rating: number;
  review_count: number;
  distance_km: number;
  bio: string;
  lat: number;
  lng: number;
  menu: {
    id: string;
    name: string;
    description: string;
    price_per_person_cents: number;
    currency: string;
    min_guests: number;
    max_guests: number;
  };
};

export type SceneProps = {
  chefs: ChefDemo[];
  isActive: boolean;
};

export type SceneDefinition = {
  id: string;
  durationMs: number;
  caption: string;
  Component: ComponentType<SceneProps>;
  cursorScript: CursorStep[];
};
