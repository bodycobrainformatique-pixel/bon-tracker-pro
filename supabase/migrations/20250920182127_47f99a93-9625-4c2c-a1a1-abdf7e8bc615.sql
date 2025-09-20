-- Add km_initial and km_final columns to bons table
ALTER TABLE public.bons 
  ADD COLUMN IF NOT EXISTS km_initial NUMERIC,
  ADD COLUMN IF NOT EXISTS km_final NUMERIC;