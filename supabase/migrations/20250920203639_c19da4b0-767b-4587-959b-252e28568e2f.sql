-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update chauffeurs table RLS policies - restrict to admin/hr roles only
DROP POLICY IF EXISTS "Authenticated users can manage chauffeurs" ON public.chauffeurs;

CREATE POLICY "Admins can manage chauffeurs" 
ON public.chauffeurs 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Update profiles table RLS policies - users can only view their own profile
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add RLS policies to statistics views
ALTER TABLE public.v_vehicule_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicle stats" 
ON public.v_vehicule_daily_stats 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

ALTER TABLE public.v_vehicule_km_current ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view current km" 
ON public.v_vehicule_km_current 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Ensure all users get admin role by default for now (can be changed later)
-- This prevents existing functionality from breaking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();