-- Create or update the review for a completed booking. Actor must be the
-- booking's customer. Booking must be in 'completed' status. On conflict
-- (booking already reviewed), update in place — no edit lockout for MVP.
CREATE OR REPLACE FUNCTION public.upsert_review(
  p_booking_id uuid,
  p_rating     smallint,
  p_comment    text
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY INVOKER
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

  -- bookings RLS already scopes to party; the explicit uid check below
  -- locks writes to the customer specifically (a chef reading their own
  -- completed booking could otherwise smuggle a review in).
  SELECT * INTO v_booking
    FROM public.bookings
   WHERE id = p_booking_id;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found or not accessible'
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

GRANT EXECUTE ON FUNCTION public.upsert_review(uuid, smallint, text)
  TO authenticated;
