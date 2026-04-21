-- Phase 0: Enable PostGIS. All chef + booking geography columns depend on this.
-- Schema migrations for profiles, chef_profiles, menus, bookings land in Phase 1.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Sanity check; PostGIS should be version 3.x on supabase/postgres:15.x
SELECT postgis_full_version();
