-- Step 2: Update the data to use consistent naming
UPDATE public.carburant_parameters 
SET type = 'gasoil50' 
WHERE type = 'gasoil_50';

-- Step 3: Add the new constraints with correct fuel types
ALTER TABLE public.carburant_parameters ADD CONSTRAINT carburant_parameters_type_check 
CHECK (type IN ('essence', 'gasoil', 'gasoil50'));

ALTER TABLE public.vehicules ADD CONSTRAINT vehicules_type_carburant_check 
CHECK (type_carburant IN ('essence', 'gasoil', 'gasoil50'));