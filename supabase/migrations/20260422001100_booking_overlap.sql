-- Phase 5: prevent a chef from having two accepted bookings whose time
-- windows overlap. Enforced by an EXCLUDE constraint on (chef_id, time
-- range), partial to status='accepted' — pending requests for the same
-- slot stay open and become un-acceptable only after a winner is picked.
--
-- EXCLUDE expressions must be IMMUTABLE, so we can't reference menus
-- (whose duration may vary) inside the constraint directly. Instead we
-- store the window end on the booking itself (bookings.event_ends_at),
-- computed at create time from the menu's duration. That keeps the DB
-- constraint atomic and race-free while letting each menu define its
-- own service length.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Extension hook: future chef menu form can expose this. Null means
-- "fall back to the 4h default" — the create_booking RPC coalesces.
ALTER TABLE public.menus
  ADD COLUMN duration_minutes int
    CHECK (duration_minutes IS NULL
           OR (duration_minutes > 0 AND duration_minutes <= 720));

-- Add event_ends_at nullable first so existing rows (none in practice,
-- but safe for any ad-hoc test data) can be backfilled, then tighten.
ALTER TABLE public.bookings
  ADD COLUMN event_ends_at timestamptz;

UPDATE public.bookings
   SET event_ends_at = event_at + interval '4 hours'
 WHERE event_ends_at IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN event_ends_at SET NOT NULL;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_event_range_valid
    CHECK (event_ends_at > event_at);

-- The exclusion constraint: two accepted bookings for the same chef
-- cannot have overlapping [event_at, event_ends_at) ranges. The partial
-- WHERE is what makes this work in an ongoing-marketplace setting —
-- pending / declined / cancelled / completed rows don't block the slot.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_chef_overlap
  EXCLUDE USING gist (
    chef_id WITH =,
    tstzrange(event_at, event_ends_at, '[)') WITH &&
  ) WHERE (status = 'accepted');
