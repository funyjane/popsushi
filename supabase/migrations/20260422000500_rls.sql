-- Default deny on every user-facing table.
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- profiles
-- Own row OR any chef row (public chef discovery reads names/avatars).
-- Inserts happen only via the handle_new_user trigger (SECURITY DEFINER).
-- Role changes are blocked by prevent_profile_role_change trigger.
-- =============================================================
CREATE POLICY profiles_select
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR role = 'chef');

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================
-- chef_profiles
-- Public read (everyone can see chef cards).
-- Only the matching chef can write, and only if their profile.role is 'chef'.
-- =============================================================
CREATE POLICY chef_profiles_select
  ON public.chef_profiles FOR SELECT
  USING (true);

CREATE POLICY chef_profiles_insert_own
  ON public.chef_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef'
  );

CREATE POLICY chef_profiles_update_own
  ON public.chef_profiles FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- =============================================================
-- menus
-- Published menus are public; unpublished drafts visible only to owning chef.
-- =============================================================
CREATE POLICY menus_select
  ON public.menus FOR SELECT
  USING (is_published OR chef_id = auth.uid());

CREATE POLICY menus_insert_own
  ON public.menus FOR INSERT
  WITH CHECK (
    chef_id = auth.uid()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'chef'
  );

CREATE POLICY menus_update_own
  ON public.menus FOR UPDATE
  USING (chef_id = auth.uid())
  WITH CHECK (chef_id = auth.uid());

CREATE POLICY menus_delete_own
  ON public.menus FOR DELETE
  USING (chef_id = auth.uid());

-- =============================================================
-- menu_items
-- Visibility + writes routed through the parent menu's RLS.
-- =============================================================
CREATE POLICY menu_items_select
  ON public.menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menus m
      WHERE m.id = menu_items.menu_id
        AND (m.is_published OR m.chef_id = auth.uid())
    )
  );

CREATE POLICY menu_items_write_own
  ON public.menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.menus m
      WHERE m.id = menu_items.menu_id AND m.chef_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.menus m
      WHERE m.id = menu_items.menu_id AND m.chef_id = auth.uid()
    )
  );

-- =============================================================
-- bookings
-- Read: customer OR chef party.
-- Insert: customer creating their own booking, must be role='customer'.
-- Update: either party; state-machine trigger enforces legal transitions.
-- =============================================================
CREATE POLICY bookings_select
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid() OR chef_id = auth.uid());

CREATE POLICY bookings_insert_own
  ON public.bookings FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'customer'
  );

CREATE POLICY bookings_update_party
  ON public.bookings FOR UPDATE
  USING (customer_id = auth.uid() OR chef_id = auth.uid())
  WITH CHECK (customer_id = auth.uid() OR chef_id = auth.uid());

-- =============================================================
-- booking_events (audit log)
-- Read-only to the booking parties. Writes are only via SECURITY DEFINER
-- triggers on bookings; client code cannot insert directly.
-- =============================================================
CREATE POLICY booking_events_select
  ON public.booking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id
        AND (b.customer_id = auth.uid() OR b.chef_id = auth.uid())
    )
  );
