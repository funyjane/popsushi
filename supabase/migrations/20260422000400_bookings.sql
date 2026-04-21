CREATE TABLE public.bookings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id               uuid NOT NULL REFERENCES public.profiles(id),
  chef_id                   uuid NOT NULL
                                REFERENCES public.chef_profiles(profile_id),
  menu_id                   uuid NOT NULL REFERENCES public.menus(id),
  event_at                  timestamptz NOT NULL,
  guest_count               int NOT NULL CHECK (guest_count > 0),
  event_location            geography(Point, 4326) NOT NULL,
  event_address             text NOT NULL,
  notes                     text,
  status                    public.booking_status NOT NULL DEFAULT 'pending',
  -- freeze price at request time so chef menu edits don't change historical amount
  price_snapshot_cents      int NOT NULL CHECK (price_snapshot_cents > 0),
  -- extension hooks
  chef_response_note        text,
  decline_reason            text,
  stripe_payment_intent_id  text,
  cancelled_at              timestamptz,
  completed_at              timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_chef_status_idx
  ON public.bookings (chef_id, status, event_at);
CREATE INDEX bookings_customer_idx
  ON public.bookings (customer_id, created_at DESC);
CREATE INDEX bookings_event_location_gix
  ON public.bookings USING GIST (event_location);

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit log. Written on every booking create + status change. Seed for
-- later chat / notification features.
CREATE TABLE public.booking_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id     uuid REFERENCES public.profiles(id),
  from_status  public.booking_status,
  to_status    public.booking_status NOT NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX booking_events_booking_idx
  ON public.booking_events (booking_id, created_at DESC);

-- State-machine: valid transitions only. Terminal states cannot transition.
-- SECURITY DEFINER so INSERT to booking_events bypasses RLS for the audit row.
CREATE OR REPLACE FUNCTION public.enforce_booking_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  CASE OLD.status
    WHEN 'pending' THEN
      ok := NEW.status IN ('accepted', 'declined', 'cancelled');
    WHEN 'accepted' THEN
      ok := NEW.status IN ('cancelled', 'completed');
    ELSE
      ok := false;
  END CASE;

  IF NOT ok THEN
    RAISE EXCEPTION 'Illegal booking transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'cancelled' THEN
    NEW.cancelled_at := coalesce(NEW.cancelled_at, now());
  ELSIF NEW.status = 'completed' THEN
    NEW.completed_at := coalesce(NEW.completed_at, now());
  END IF;

  INSERT INTO public.booking_events (booking_id, actor_id, from_status, to_status)
  VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_transition
BEFORE UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_transition();

-- Log the creation event too. SECURITY DEFINER for same RLS reason.
CREATE OR REPLACE FUNCTION public.log_booking_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.booking_events (booking_id, actor_id, from_status, to_status, note)
  VALUES (NEW.id, auth.uid(), NULL, NEW.status, 'Booking created');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_created_log
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_creation();

-- TODO(phase 4+): add an exclusion constraint or accept-time trigger to
-- prevent a chef from accepting two overlapping bookings.
