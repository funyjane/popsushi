-- Create a booking. SECURITY INVOKER so the bookings_insert_own RLS policy
-- (customer_id = auth.uid() AND role='customer') still enforces who can do
-- it. The RPC exists because event_location is geography and we want to
-- snapshot price + validate menu/chef coupling server-side.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_chef_id        uuid,
  p_menu_id        uuid,
  p_event_at       timestamptz,
  p_guest_count    int,
  p_lat            double precision,
  p_lng            double precision,
  p_event_address  text,
  p_notes          text
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid           uuid := auth.uid();
  v_menu        public.menus;
  v_booking     public.bookings;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_event_at <= now() THEN
    RAISE EXCEPTION 'Event must be in the future' USING ERRCODE = '22023';
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL
     OR p_lat NOT BETWEEN -90 AND 90
     OR p_lng NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'lat/lng out of range' USING ERRCODE = '22023';
  END IF;

  -- Validate menu belongs to chef and is published. The SELECT is under RLS
  -- (caller's perspective), but menus.is_published + chef_id = anyone's is
  -- publicly readable so this always resolves when the menu is bookable.
  SELECT * INTO v_menu
    FROM public.menus
   WHERE id = p_menu_id AND chef_id = p_chef_id AND is_published;

  IF v_menu.id IS NULL THEN
    RAISE EXCEPTION 'Menu not found or not published'
      USING ERRCODE = '23503';
  END IF;

  IF p_guest_count < v_menu.min_guests OR p_guest_count > v_menu.max_guests THEN
    RAISE EXCEPTION
      'Guest count % outside menu range %-%',
      p_guest_count, v_menu.min_guests, v_menu.max_guests
      USING ERRCODE = '22023';
  END IF;

  -- Insert under RLS. bookings_insert_own requires customer_id=auth.uid()
  -- AND role='customer'; if the caller is a chef, this raises and we surface
  -- that cleanly.
  INSERT INTO public.bookings (
    customer_id, chef_id, menu_id, event_at, guest_count,
    event_location, event_address, notes, price_snapshot_cents
  )
  VALUES (
    uid, p_chef_id, p_menu_id, p_event_at, p_guest_count,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_event_address, nullif(p_notes, ''),
    v_menu.price_per_person_cents * p_guest_count
  )
  RETURNING * INTO v_booking;

  -- log_booking_creation trigger writes the 'Booking created' audit row.
  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(
  uuid, uuid, timestamptz, int, double precision, double precision, text, text
) TO authenticated;


-- Transition a booking's status. Four actions — each has its own actor
-- rules (customer vs chef) on top of the state-machine trigger. RLS on
-- bookings already scopes the row to the two parties; this RPC adds the
-- per-action actor check that RLS alone can't express (a customer should
-- not be able to 'accept' their own booking).
--
-- Notes:
--   action='accept'   + note → chef_response_note
--   action='decline'  + note → decline_reason (required)
--   action='cancel'             (note is optional, stored as chef_response_note if chef cancels)
--   action='complete'           (note optional, stored as chef_response_note)
CREATE OR REPLACE FUNCTION public.transition_booking(
  p_booking_id uuid,
  p_action     text,
  p_note       text DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid        uuid := auth.uid();
  v_booking  public.bookings;
  v_status   public.booking_status;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Lock the row so concurrent transitions serialize. RLS scopes this to
  -- (customer_id, chef_id) — if the caller is neither, we get 0 rows and
  -- bail with a clear message.
  SELECT * INTO v_booking
    FROM public.bookings
   WHERE id = p_booking_id
   FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found or not accessible'
      USING ERRCODE = '42501';
  END IF;

  CASE p_action
    WHEN 'accept' THEN
      IF uid <> v_booking.chef_id THEN
        RAISE EXCEPTION 'Only the chef can accept' USING ERRCODE = '42501';
      END IF;
      v_status := 'accepted';
      UPDATE public.bookings
         SET status = v_status,
             chef_response_note = coalesce(nullif(p_note, ''), chef_response_note)
       WHERE id = p_booking_id
       RETURNING * INTO v_booking;

    WHEN 'decline' THEN
      IF uid <> v_booking.chef_id THEN
        RAISE EXCEPTION 'Only the chef can decline' USING ERRCODE = '42501';
      END IF;
      IF p_note IS NULL OR btrim(p_note) = '' THEN
        RAISE EXCEPTION 'Decline reason is required' USING ERRCODE = '22023';
      END IF;
      v_status := 'declined';
      UPDATE public.bookings
         SET status = v_status,
             decline_reason = p_note
       WHERE id = p_booking_id
       RETURNING * INTO v_booking;

    WHEN 'cancel' THEN
      IF uid <> v_booking.customer_id AND uid <> v_booking.chef_id THEN
        RAISE EXCEPTION 'Only a booking party can cancel' USING ERRCODE = '42501';
      END IF;
      v_status := 'cancelled';
      UPDATE public.bookings
         SET status = v_status,
             chef_response_note = CASE
               WHEN uid = v_booking.chef_id
                 THEN coalesce(nullif(p_note, ''), chef_response_note)
               ELSE chef_response_note
             END
       WHERE id = p_booking_id
       RETURNING * INTO v_booking;

    WHEN 'complete' THEN
      IF uid <> v_booking.chef_id THEN
        RAISE EXCEPTION 'Only the chef can mark completed' USING ERRCODE = '42501';
      END IF;
      v_status := 'completed';
      UPDATE public.bookings
         SET status = v_status,
             chef_response_note = coalesce(nullif(p_note, ''), chef_response_note)
       WHERE id = p_booking_id
       RETURNING * INTO v_booking;

    ELSE
      RAISE EXCEPTION 'Unknown action: %', p_action USING ERRCODE = '22023';
  END CASE;

  -- enforce_booking_transition trigger rejects illegal status transitions
  -- and writes the audit row.

  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_booking(uuid, text, text)
  TO authenticated;
