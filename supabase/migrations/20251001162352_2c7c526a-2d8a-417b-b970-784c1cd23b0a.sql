-- Ensure REPLICA IDENTITY FULL is set for bons table for complete realtime updates
ALTER TABLE public.bons REPLICA IDENTITY FULL;