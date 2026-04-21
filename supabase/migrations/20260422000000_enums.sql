-- Role + booking status enums. 'admin' in user_role is an extension hook;
-- no admin UI in MVP but RLS policies can grow `OR role='admin'`.
CREATE TYPE public.user_role AS ENUM ('customer', 'chef', 'admin');
CREATE TYPE public.booking_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'completed'
);
