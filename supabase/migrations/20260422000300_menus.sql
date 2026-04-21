-- Menus: schema supports 1:N per chef; MVP UI exposes the latest published.
CREATE TABLE public.menus (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id                 uuid NOT NULL
                              REFERENCES public.chef_profiles(profile_id)
                              ON DELETE CASCADE,
  name                    text NOT NULL,
  description             text NOT NULL,
  price_per_person_cents  int NOT NULL CHECK (price_per_person_cents > 0),
  currency                char(3) NOT NULL DEFAULT 'USD',
  min_guests              int NOT NULL DEFAULT 2 CHECK (min_guests >= 1),
  max_guests              int NOT NULL DEFAULT 12 CHECK (max_guests >= min_guests),
  is_published            boolean NOT NULL DEFAULT true,
  cover_image_path        text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX menus_chef_id_published_idx
  ON public.menus (chef_id) WHERE is_published;

-- Menu items: extension hook, ship empty. UI reads `menus.description` for MVP.
CREATE TABLE public.menu_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id      uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  course       int NOT NULL,
  name         text NOT NULL,
  description  text
);

CREATE INDEX menu_items_menu_id_idx ON public.menu_items (menu_id, course);
