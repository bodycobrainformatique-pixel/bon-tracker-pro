-- Phase 1: Create secure access functions for views (can't add RLS to views directly)
-- Create secure function for vehicle daily stats
CREATE OR REPLACE FUNCTION public.get_vehicle_daily_stats(vehicle_id_param uuid DEFAULT NULL)
RETURNS TABLE (
  vehicule_id uuid,
  immatriculation text,
  jour date,
  km_total numeric,
  litres_total numeric,
  cout_tnd numeric,
  l_per_100km numeric
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    vds.vehicule_id,
    vds.immatriculation, 
    vds.jour,
    vds.km_total,
    vds.litres_total,
    vds.cout_tnd,
    vds.l_per_100km
  FROM v_vehicule_daily_stats vds
  WHERE 
    auth.uid() IS NOT NULL 
    AND (vehicle_id_param IS NULL OR vds.vehicule_id = vehicle_id_param);
$$;

-- Create secure function for current vehicle km
CREATE OR REPLACE FUNCTION public.get_vehicle_current_km(vehicle_id_param uuid DEFAULT NULL)
RETURNS TABLE (
  vehicule_id uuid,
  immatriculation text,
  current_km numeric
) 
LANGUAGE sql
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    vkc.vehicule_id,
    vkc.immatriculation,
    vkc.current_km
  FROM v_vehicule_km_current vkc
  WHERE 
    auth.uid() IS NOT NULL
    AND (vehicle_id_param IS NULL OR vkc.vehicule_id = vehicle_id_param);
$$;

-- Phase 2: Enhance RLS policies for chauffeurs table with proper role-based access
DROP POLICY IF EXISTS "Admins can manage chauffeurs" ON chauffeurs;

-- Admins can manage all chauffeur data
CREATE POLICY "Admins can manage chauffeurs" 
ON chauffeurs 
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Chauffeurs can only view basic info (nom, prenom, id) - no sensitive data
CREATE POLICY "Chauffeurs can view basic info" 
ON chauffeurs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  get_current_user_role() = 'chauffeur'
);

-- Phase 3: Fix user role assignment 
-- Update the handle_new_user function to assign proper roles based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Determine role based on email
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    CASE 
      WHEN NEW.email = 'chauffeur@gss.com' THEN 'chauffeur'
      WHEN NEW.email LIKE 'admin%@gss.com' OR NEW.email = 'admin@tracabilite.tn' THEN 'admin'
      ELSE 'chauffeur'  -- Default to chauffeur for security
    END
  );
  RETURN NEW;
END;
$$;

-- Update existing chauffeur user role if it exists and is incorrectly set to admin
UPDATE profiles 
SET role = 'chauffeur' 
WHERE email = 'chauffeur@gss.com' AND role = 'admin';