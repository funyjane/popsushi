-- Grant table access to the anon / authenticated roles used by PostgREST.
-- RLS still governs what rows they can see/modify, but they need table-level
-- privileges for PostgREST to consider the relation at all.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles       TO anon, authenticated;
GRANT UPDATE ON public.profiles       TO authenticated;

GRANT SELECT ON public.chef_profiles  TO anon, authenticated;
GRANT INSERT, UPDATE ON public.chef_profiles TO authenticated;

GRANT SELECT ON public.menus          TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menus TO authenticated;

GRANT SELECT ON public.menu_items     TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;

GRANT SELECT ON public.bookings       TO authenticated;
GRANT INSERT, UPDATE ON public.bookings TO authenticated;

GRANT SELECT ON public.booking_events TO authenticated;
