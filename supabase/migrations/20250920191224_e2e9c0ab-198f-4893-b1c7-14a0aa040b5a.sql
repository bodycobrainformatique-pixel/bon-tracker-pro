-- VEHICULES: relax NOT NULLs & make only plate and fuel type required
ALTER TABLE public.vehicules
  ALTER COLUMN immatriculation SET NOT NULL,
  ALTER COLUMN type_carburant SET NOT NULL;

-- Make everything else nullable
ALTER TABLE public.vehicules
  ALTER COLUMN marque DROP NOT NULL,
  ALTER COLUMN modele DROP NOT NULL,
  ALTER COLUMN annee DROP NOT NULL,
  ALTER COLUMN couleur DROP NOT NULL,
  ALTER COLUMN capacite_reservoir DROP NOT NULL,
  ALTER COLUMN cout_acquisition DROP NOT NULL,
  ALTER COLUMN date_mise_en_service DROP NOT NULL;

-- Remove manual kilometrage column if it exists
ALTER TABLE public.vehicules DROP COLUMN IF EXISTS kilometrage;

-- BONS: ensure all needed columns exist and are properly typed
ALTER TABLE public.bons
  ADD COLUMN IF NOT EXISTS closed_by_bon_id UUID,
  ADD COLUMN IF NOT EXISTS closed_at_date DATE;

-- Ensure proper index for finding previous bon efficiently
CREATE INDEX IF NOT EXISTS idx_bons_vehicle_date_numero
  ON public.bons (vehicule_id, date, numero);

-- Updated trigger function for better distance calculation
CREATE OR REPLACE FUNCTION public.update_previous_bon_km()
RETURNS TRIGGER AS $$
DECLARE
  prev_bon_id UUID;
  prev_km_initial NUMERIC;
BEGIN
  -- Find the previous bon for the same vehicle (most recent before current bon)
  SELECT id, km_initial INTO prev_bon_id, prev_km_initial
  FROM public.bons
  WHERE vehicule_id = NEW.vehicule_id
    AND id != NEW.id
    AND (date < NEW.date OR (date = NEW.date AND numero < NEW.numero))
  ORDER BY date DESC, numero DESC
  LIMIT 1;

  -- Update the previous bon's km_final and distance if found
  IF prev_bon_id IS NOT NULL AND NEW.km_initial IS NOT NULL THEN
    UPDATE public.bons
    SET km_final = NEW.km_initial,
        distance = CASE
          WHEN NEW.km_initial IS NOT NULL AND prev_km_initial IS NOT NULL
          THEN GREATEST(NEW.km_initial - prev_km_initial, 0)
          ELSE NULL
        END,
        closed_by_bon_id = NEW.id,
        closed_at_date = NEW.date,
        updated_at = now()
    WHERE id = prev_bon_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_update_prev_bon ON public.bons;
CREATE TRIGGER trg_update_prev_bon
AFTER INSERT OR UPDATE OF km_initial ON public.bons
FOR EACH ROW
EXECUTE FUNCTION public.update_previous_bon_km();

-- Trigger to compute distance when km values change on current bon
CREATE OR REPLACE FUNCTION public.compute_bon_distance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.km_initial IS NOT NULL AND NEW.km_final IS NOT NULL THEN
    NEW.distance := GREATEST(NEW.km_final - NEW.km_initial, 0);
  ELSE
    NEW.distance := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_bon_distance ON public.bons;
CREATE TRIGGER trg_compute_bon_distance
BEFORE INSERT OR UPDATE OF km_initial, km_final
ON public.bons
FOR EACH ROW
EXECUTE FUNCTION public.compute_bon_distance();

-- Parameters table for fuel prices
CREATE TABLE IF NOT EXISTS public.carburant_parameters (
  type_carburant TEXT PRIMARY KEY CHECK (type_carburant IN ('essence','gasoil','gasoil_50')),
  prix_litre NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default fuel prices if not exists
INSERT INTO public.carburant_parameters (type_carburant, prix_litre) 
VALUES 
  ('essence', 1.8),
  ('gasoil', 1.5),
  ('gasoil_50', 1.6)
ON CONFLICT (type_carburant) DO NOTHING;

-- Enable RLS on carburant_parameters
ALTER TABLE public.carburant_parameters ENABLE ROW LEVEL SECURITY;

-- RLS policy for carburant_parameters
CREATE POLICY "Authenticated users can manage fuel parameters" 
ON public.carburant_parameters 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- View: current km per vehicle (last closed km_final)
CREATE OR REPLACE VIEW public.v_vehicule_km_current AS
SELECT
  v.id AS vehicule_id,
  v.immatriculation,
  COALESCE(MAX(b.km_final), 0) AS current_km
FROM public.vehicules v
LEFT JOIN public.bons b ON b.vehicule_id = v.id AND b.km_final IS NOT NULL
GROUP BY v.id, v.immatriculation;

-- View: daily stats per vehicle
CREATE OR REPLACE VIEW public.v_vehicule_daily_stats AS
SELECT
  b.vehicule_id,
  v.immatriculation,
  b.closed_at_date AS jour,
  SUM(b.distance) AS km_total,
  SUM(b.montant) AS cout_tnd,
  SUM(
    CASE 
      WHEN cp.prix_litre > 0 THEN b.montant / cp.prix_litre 
      ELSE 0 
    END
  ) AS litres_total,
  CASE
    WHEN SUM(b.distance) > 0
      THEN (100.0 * SUM(CASE WHEN cp.prix_litre > 0 THEN b.montant / cp.prix_litre ELSE 0 END) / SUM(b.distance))
    ELSE NULL
  END AS l_per_100km
FROM public.bons b
JOIN public.vehicules v ON v.id = b.vehicule_id
LEFT JOIN public.carburant_parameters cp ON cp.type_carburant = b.type
WHERE b.closed_at_date IS NOT NULL AND b.distance IS NOT NULL AND b.distance > 0
GROUP BY b.vehicule_id, v.immatriculation, b.closed_at_date
ORDER BY b.closed_at_date DESC;

-- Enable realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carburant_parameters;

-- Set replica identity for realtime
ALTER TABLE public.bons REPLICA IDENTITY FULL;
ALTER TABLE public.vehicules REPLICA IDENTITY FULL;
ALTER TABLE public.carburant_parameters REPLICA IDENTITY FULL;