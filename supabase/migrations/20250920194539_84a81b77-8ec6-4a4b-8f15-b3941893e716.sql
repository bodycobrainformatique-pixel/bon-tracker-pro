-- Fix the vehicules type_carburant constraint to accept the correct fuel types
ALTER TABLE public.vehicules DROP CONSTRAINT IF EXISTS vehicules_type_carburant_check;
ALTER TABLE public.vehicules ADD CONSTRAINT vehicules_type_carburant_check 
CHECK (type_carburant IN ('essence', 'gasoil', 'gasoil50'));

-- Update the fuel parameters to use consistent naming (gasoil50 instead of gasoil_50)
UPDATE public.carburant_parameters 
SET type = 'gasoil50' 
WHERE type = 'gasoil_50';

-- Ensure we have all three fuel types in parameters if they don't exist
INSERT INTO public.carburant_parameters (type, prix) 
VALUES 
    ('essence', 1.500),
    ('gasoil', 1.300),
    ('gasoil50', 1.450)
ON CONFLICT (type) DO NOTHING;