-- Fix Security Definer View Issue by setting security_invoker to true
-- This ensures views respect the querying user's permissions and RLS policies

-- Set security_invoker = true for all vehicle-related views
ALTER VIEW v_vehicule_daily_stats SET (security_invoker = true);
ALTER VIEW v_vehicule_km_current SET (security_invoker = true);
ALTER VIEW vehicules_current_odometer SET (security_invoker = true);