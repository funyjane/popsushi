-- Phase 4 followup: chefs need to read their customer's display_name and
-- phone to service incoming bookings. The Phase 1 profiles_select policy
-- only exposed own profile OR any chef, so the PostgREST embed in the
-- chef-facing queries would silently filter rows via !inner.
--
-- Extension: if the caller is a booking party, they can read the
-- counterparty's profile row. The EXISTS subquery runs under RLS for
-- bookings (customer_id=auth.uid() OR chef_id=auth.uid()), so this
-- composes cleanly — it doesn't widen access beyond what's already
-- visible via the bookings relation.
DROP POLICY profiles_select ON public.profiles;

CREATE POLICY profiles_select
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR role = 'chef'
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.customer_id = auth.uid() AND b.chef_id = profiles.id)
         OR (b.chef_id = auth.uid() AND b.customer_id = profiles.id)
    )
  );
