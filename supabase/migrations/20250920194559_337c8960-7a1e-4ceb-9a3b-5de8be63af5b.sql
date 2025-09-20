-- Fix both table constraints to use consistent fuel type naming
-- First fix carburant_parameters constraint
ALTER TABLE public.carburant_parameters DROP CONSTRAINT IF EXISTS carburant_parameters_type_check;
ALTER TABLE public.carburant_parameters ADD CONSTRAINT carburant_parameters_type_check 
CHECK (type IN ('essence', 'gasoil', 'gasoil50'));

-- Fix vehicules constraint  
ALTER TABLE public.vehicules DROP CONSTRAINT IF EXISTS vehicules_type_carburant_check;
ALTER TABLE public.vehicules ADD CONSTRAINT vehicules_type_carburant_check 
CHECK (type_carburant IN ('essence', 'gasoil', 'gasoil50'));

-- Update existing data to use consistent naming
UPDATE public.carburant_parameters 
SET type = 'gasoil50' 
WHERE type = 'gasoil_50';

-- Ensure we have all three fuel types in parameters
INSERT INTO public.carburant_parameters (type, prix) 
VALUES 
    ('essence', 1.500),
    ('gasoil', 1.300),
    ('gasoil50', 1.450)
ON CONFLICT (type) DO NOTHING;