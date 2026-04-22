-- Reviews: 1-5 stars + optional comment, one per booking. Writes go
-- through upsert_review (next migration); direct INSERT/UPDATE is not
-- exposed via RLS policies. Reads are public (marketplace signal).

CREATE TABLE public.reviews (
  booking_id   uuid PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id  uuid NOT NULL REFERENCES public.profiles(id),
  chef_id      uuid NOT NULL REFERENCES public.chef_profiles(profile_id) ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text CHECK (comment IS NULL OR char_length(comment) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_chef_id_idx ON public.reviews (chef_id, created_at DESC);
CREATE INDEX reviews_customer_id_idx ON public.reviews (customer_id);

CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public read; marketplace discovery needs anon visibility.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select ON public.reviews FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies: all writes flow through
-- upsert_review() which checks actor + booking state. Direct client
-- writes will fail with no matching policy.

GRANT SELECT ON public.reviews TO anon, authenticated;

-- Rollup: keep chef_profiles.avg_rating and review_count in sync. AFTER
-- trigger recomputes from reviews for the affected chef(s). Not the
-- fastest approach for millions of rows, but trivially correct and the
-- rollup is bounded by reviews-per-chef. SECURITY DEFINER because the
-- UPDATE bypasses chef_profiles_update_own RLS.
CREATE OR REPLACE FUNCTION public.refresh_chef_rating(p_chef_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chef_profiles cp
     SET avg_rating = agg.avg_rating,
         review_count = agg.cnt
    FROM (
      SELECT r.chef_id,
             round(avg(r.rating)::numeric, 2) AS avg_rating,
             count(*) AS cnt
        FROM public.reviews r
       WHERE r.chef_id = p_chef_id
       GROUP BY r.chef_id
    ) agg
   WHERE cp.profile_id = agg.chef_id;

  -- If all reviews for a chef were deleted, the GROUP BY above returns
  -- no rows and nothing is updated. Zero them out explicitly.
  UPDATE public.chef_profiles
     SET avg_rating = NULL,
         review_count = 0
   WHERE profile_id = p_chef_id
     AND NOT EXISTS (SELECT 1 FROM public.reviews WHERE chef_id = p_chef_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reviews_rollup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_chef_rating(NEW.chef_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.refresh_chef_rating(NEW.chef_id);
    IF NEW.chef_id <> OLD.chef_id THEN
      PERFORM public.refresh_chef_rating(OLD.chef_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_chef_rating(OLD.chef_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reviews_rollup
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_rollup();
