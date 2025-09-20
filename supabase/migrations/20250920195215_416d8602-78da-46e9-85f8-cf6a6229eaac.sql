-- Phase 1: Critical Fixes - Fix fuel type constraints and data consistency

-- Step 1: Fix existing bon data to match vehicle fuel types
UPDATE public.bons 
SET type = 'gasoil50' 
WHERE type = 'gasoil' 
AND vehicule_id IN (
  SELECT id FROM public.vehicules WHERE type_carburant = 'gasoil50'
);

-- Step 2: Add proper constraints for bons.type to match vehicle fuel types
ALTER TABLE public.bons ADD CONSTRAINT bons_type_check 
CHECK (type IN ('essence', 'gasoil', 'gasoil50'));

-- Step 3: Clean up duplicate triggers (keep only the newer one)
DROP TRIGGER IF EXISTS trigger_update_previous_bon_km ON public.bons;

-- Step 4: Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_bons_vehicule_date_numero ON public.bons(vehicule_id, date DESC, numero DESC);
CREATE INDEX IF NOT EXISTS idx_bons_chauffeur_date ON public.bons(chauffeur_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bons_date_type ON public.bons(date DESC, type);

-- Step 5: Drop unnecessary chauffeur fields to simplify the model
ALTER TABLE public.chauffeurs DROP COLUMN IF EXISTS date_naissance;
ALTER TABLE public.chauffeurs DROP COLUMN IF EXISTS salaire_base;

-- Step 6: Add constraint to ensure chauffeur CIN uniqueness
ALTER TABLE public.chauffeurs ADD CONSTRAINT chauffeurs_cin_unique UNIQUE (cin);