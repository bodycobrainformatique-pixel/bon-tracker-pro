-- Step 1: Drop all existing constraints
ALTER TABLE public.carburant_parameters DROP CONSTRAINT IF EXISTS carburant_parameters_type_check;
ALTER TABLE public.vehicules DROP CONSTRAINT IF EXISTS vehicules_type_carburant_check;