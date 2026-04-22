-- Phase 5 followup: update create_booking to set event_ends_at (required
-- for the EXCLUDE overlap constraint) and transition_booking to surface a
-- clean error when an accept hits that constraint.

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
  uid       uuid := auth.uid();
  v_menu    public.menus;
  v_booking public.bookings;
  v_minutes int;
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

  -- Menu drives the service window; fall back to 4h until chefs can
  -- configure it in the UI.
  v_minutes := coalesce(v_menu.duration_minutes, 240);

  INSERT INTO public.bookings (
    customer_id, chef_id, menu_id, event_at, event_ends_at, guest_count,
    event_location, event_address, notes, price_snapshot_cents
  )
  VALUES (
    uid, p_chef_id, p_menu_id, p_event_at,
    p_event_at + (v_minutes || ' minutes')::interval,
    p_guest_count,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_event_address, nullif(p_notes, ''),
    v_menu.price_per_person_cents * p_guest_count
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;


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
      BEGIN
        UPDATE public.bookings
           SET status = v_status,
               chef_response_note = coalesce(nullif(p_note, ''), chef_response_note)
         WHERE id = p_booking_id
         RETURNING * INTO v_booking;
      EXCEPTION WHEN exclusion_violation THEN
        -- bookings_no_chef_overlap blocked the accept. The chef already
        -- has another accepted booking whose window overlaps this one.
        RAISE EXCEPTION
          'You already have an accepted booking that overlaps this time slot'
          USING ERRCODE = '23P01';
      END;

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

  RETURN v_booking;
END;
$$;
