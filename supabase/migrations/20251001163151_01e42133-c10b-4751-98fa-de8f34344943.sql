-- Add chauffeur_id to profiles table to properly link users to chauffeurs
ALTER TABLE public.profiles 
ADD COLUMN chauffeur_id UUID REFERENCES public.chauffeurs(id) ON DELETE SET NULL;

-- Create an index for better performance
CREATE INDEX idx_profiles_chauffeur_id ON public.profiles(chauffeur_id);

-- Link the existing chauffeur user to the first chauffeur record
-- This is a temporary fix - in production, admins should manage these links
UPDATE public.profiles 
SET chauffeur_id = '16cdabfb-4865-4bad-9c11-29013dd05358'
WHERE email = 'chauffeur@gss.com';