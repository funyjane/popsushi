-- Phase 6 fix: upsert_review needs SECURITY DEFINER. reviews has no
-- INSERT/UPDATE policies by design — all writes flow through this RPC.
-- Running as DEFINER bypasses that policy void; the function body
-- still derives customer_id from auth.uid() and validates the booking's
-- status + ownership, so there's no parameter-injection surface.
CREATE OR REPLACE FUNCTION public.upsert_review(
  p_booking_id uuid,
  p_rating     smallint,
  p_comment    text
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid       uuid := auth.uid();
  v_booking public.bookings;
  v_review  public.reviews;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be 1..5' USING ERRCODE = '22023';
  END IF;

  -- SECURITY DEFINER bypasses bookings RLS too, so we have to do the
  -- "is the caller allowed to see this booking" check ourselves.
  SELECT * INTO v_booking
    FROM public.bookings
   WHERE id = p_booking_id;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found'
      USING ERRCODE = '42501';
  END IF;

  IF v_booking.customer_id <> uid THEN
    RAISE EXCEPTION 'Only the customer can review this booking'
      USING ERRCODE = '42501';
  END IF;

  IF v_booking.status <> 'completed' THEN
    RAISE EXCEPTION 'Only completed bookings can be reviewed'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.reviews (booking_id, customer_id, chef_id, rating, comment)
  VALUES (p_booking_id, uid, v_booking.chef_id, p_rating, nullif(btrim(p_comment), ''))
  ON CONFLICT (booking_id) DO UPDATE SET
    rating  = EXCLUDED.rating,
    comment = EXCLUDED.comment
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;
