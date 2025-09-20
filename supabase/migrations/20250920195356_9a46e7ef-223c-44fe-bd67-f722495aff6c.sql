-- Fix the constraint issue - Remove constraint first, fix data, then re-add

-- Step 1: Remove the failing constraint
ALTER TABLE public.bons DROP CONSTRAINT IF EXISTS bons_type_check;

-- Step 2: Update all bon data to match their vehicle's fuel type
UPDATE public.bons 
SET type = v.type_carburant
FROM public.vehicules v 
WHERE public.bons.vehicule_id = v.id 
AND public.bons.type != v.type_carburant;

-- Step 3: Re-add the constraint
ALTER TABLE public.bons ADD CONSTRAINT bons_type_check 
CHECK (type IN ('essence', 'gasoil', 'gasoil50'));