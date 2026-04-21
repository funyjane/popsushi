-- Phase 0 hello-world: expose a trivial RPC via PostgREST so the web app can
-- prove DB connectivity. Safe to keep around; replaced by real queries once
-- Phase 1 tables ship.
CREATE OR REPLACE FUNCTION public.hello_rpc()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'now', now(),
    'postgres_version', version(),
    'postgis', postgis_version()
  );
$$;

-- Allow the anon role (via PostgREST) to call this.
GRANT EXECUTE ON FUNCTION public.hello_rpc() TO anon, authenticated;
