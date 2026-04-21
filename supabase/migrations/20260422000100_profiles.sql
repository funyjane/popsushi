-- Shared updated_at trigger helper, reused across tables below.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- One row per authenticated user. Mirrors auth.users 1:1.
CREATE TABLE public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  public.user_role NOT NULL,
  display_name          text NOT NULL,
  avatar_path           text,
  phone                 text,
  -- extension hooks (MVP unused, nullable so they don't block)
  stripe_customer_id    text,
  notifications_opt_in  boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Prevent role escalation via UPDATE. Role is only set at signup via
-- handle_new_user() and must not be changeable from the client.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Cannot change profile.role after signup';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_lock_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- handle_new_user: fires when GoTrue inserts into auth.users. Reads
-- raw_user_meta_data.role from the signup payload and creates the profile row.
-- SECURITY DEFINER so it can bypass RLS on public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role   text;
  final_role  public.user_role;
  display     text;
BEGIN
  meta_role := lower(coalesce(NEW.raw_user_meta_data ->> 'role', ''));
  display   := coalesce(
                 nullif(NEW.raw_user_meta_data ->> 'display_name', ''),
                 split_part(NEW.email, '@', 1)
               );

  IF meta_role NOT IN ('customer', 'chef') THEN
    RAISE EXCEPTION
      'Signup metadata must set role to one of: customer, chef (got: %)',
      meta_role;
  END IF;

  final_role := meta_role::public.user_role;

  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, final_role, display);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
