-- Chef-specific data; 1:1 with profiles for rows where role='chef'.
-- base_location as geography(Point,4326) for meter-correct distance math.
CREATE TABLE public.chef_profiles (
  profile_id         uuid PRIMARY KEY
                         REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio                text NOT NULL,
  base_location      geography(Point, 4326) NOT NULL,
  base_address       text NOT NULL,
  service_radius_km  int NOT NULL DEFAULT 25
                         CHECK (service_radius_km BETWEEN 1 AND 200),
  years_experience   int,
  is_active          boolean NOT NULL DEFAULT true,
  -- extension hooks
  avg_rating         numeric(3,2),
  review_count       int NOT NULL DEFAULT 0,
  stripe_connect_id  text,
  verified_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- GIST mandatory or ST_DWithin seq-scans at scale.
CREATE INDEX chef_profiles_base_location_gix
  ON public.chef_profiles USING GIST (base_location);

-- Partial index — discovery only surfaces active chefs.
CREATE INDEX chef_profiles_active_idx
  ON public.chef_profiles (is_active) WHERE is_active;

CREATE TRIGGER trg_chef_profiles_updated_at
BEFORE UPDATE ON public.chef_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
