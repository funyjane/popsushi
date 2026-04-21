-- Upsert the current user's chef_profile. SECURITY INVOKER so the existing
-- RLS policies (chef_profiles_insert_own / chef_profiles_update_own) apply.
-- Callers pass raw lat/lng; the function assembles the geography(Point,4326).
CREATE OR REPLACE FUNCTION public.upsert_my_chef_profile(
  p_bio               text,
  p_base_address      text,
  p_lat               double precision,
  p_lng               double precision,
  p_service_radius_km int,
  p_years_experience  int,
  p_is_active         boolean
)
RETURNS public.chef_profiles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.chef_profiles;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL
     OR p_lat NOT BETWEEN -90 AND 90
     OR p_lng NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'lat/lng out of range' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.chef_profiles AS cp (
    profile_id, bio, base_location, base_address,
    service_radius_km, years_experience, is_active
  )
  VALUES (
    uid, p_bio,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_base_address,
    p_service_radius_km, p_years_experience, p_is_active
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    bio               = EXCLUDED.bio,
    base_location     = EXCLUDED.base_location,
    base_address      = EXCLUDED.base_address,
    service_radius_km = EXCLUDED.service_radius_km,
    years_experience  = EXCLUDED.years_experience,
    is_active         = EXCLUDED.is_active,
    updated_at        = now()
  RETURNING * INTO row;

  RETURN row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_my_chef_profile(
  text, text, double precision, double precision, int, int, boolean
) TO authenticated;

-- Read helper: PostgREST cannot project ST_X/ST_Y on a geography column
-- directly, and geography on the wire is hex WKB. This flattens to lat/lng
-- so the chef profile form can round-trip cleanly.
CREATE OR REPLACE FUNCTION public.get_my_chef_profile()
RETURNS TABLE (
  profile_id        uuid,
  bio               text,
  base_address      text,
  lat               double precision,
  lng               double precision,
  service_radius_km int,
  years_experience  int,
  is_active         boolean
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT
    cp.profile_id,
    cp.bio,
    cp.base_address,
    ST_Y(cp.base_location::geometry) AS lat,
    ST_X(cp.base_location::geometry) AS lng,
    cp.service_radius_km,
    cp.years_experience,
    cp.is_active
  FROM public.chef_profiles cp
  WHERE cp.profile_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_chef_profile() TO authenticated;
