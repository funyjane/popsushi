-- Search for chefs whose service area covers the customer's event location
-- and whose most-recent published menu fits the requested guest count.
-- SECURITY INVOKER so the caller's RLS (profiles/chef_profiles/menus selects)
-- still applies; in practice all three tables are publicly readable for
-- active / published rows so anon callers get the same result as authenticated.
CREATE OR REPLACE FUNCTION public.search_chefs(
  p_lat          double precision,
  p_lng          double precision,
  p_guest_count  int DEFAULT NULL
)
RETURNS TABLE (
  chef_id                 uuid,
  display_name            text,
  avatar_path             text,
  base_address            text,
  chef_lat                double precision,
  chef_lng                double precision,
  years_experience        int,
  avg_rating              numeric,
  distance_km             double precision,
  menu_id                 uuid,
  menu_name               text,
  menu_description        text,
  price_per_person_cents  int,
  currency                char(3),
  min_guests              int,
  max_guests              int
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  WITH pt AS (
    SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g
  )
  SELECT
    cp.profile_id                                     AS chef_id,
    p.display_name,
    p.avatar_path,
    cp.base_address,
    ST_Y(cp.base_location::geometry)                  AS chef_lat,
    ST_X(cp.base_location::geometry)                  AS chef_lng,
    cp.years_experience,
    cp.avg_rating,
    (ST_Distance(cp.base_location, pt.g) / 1000.0)    AS distance_km,
    m.id                                              AS menu_id,
    m.name                                            AS menu_name,
    m.description                                     AS menu_description,
    m.price_per_person_cents,
    m.currency,
    m.min_guests,
    m.max_guests
  FROM public.chef_profiles cp
  CROSS JOIN pt
  JOIN public.profiles p
    ON p.id = cp.profile_id AND p.role = 'chef'
  JOIN LATERAL (
    -- Pick the most recently created published menu per chef.
    -- MVP UI enforces one-per-chef; LATERAL makes the query robust if
    -- that ever changes.
    SELECT m2.*
    FROM public.menus m2
    WHERE m2.chef_id = cp.profile_id
      AND m2.is_published
    ORDER BY m2.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE cp.is_active
    AND ST_DWithin(cp.base_location, pt.g, cp.service_radius_km * 1000)
    AND (p_guest_count IS NULL
         OR p_guest_count BETWEEN m.min_guests AND m.max_guests)
  ORDER BY distance_km ASC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.search_chefs(double precision, double precision, int)
  TO anon, authenticated;
