-- Fix security issues: recreate views as SECURITY INVOKER and fix function search paths

-- Drop existing views 
DROP VIEW IF EXISTS public.v_vehicule_km_current;
DROP VIEW IF EXISTS public.v_vehicule_daily_stats;

-- Recreate view with proper security
CREATE VIEW public.v_vehicule_km_current 
WITH (security_invoker = true) AS
SELECT
  v.id AS vehicule_id,
  v.immatriculation,
  COALESCE(MAX(b.km_final), 0) AS current_km
FROM public.vehicules v
LEFT JOIN public.bons b ON b.vehicule_id = v.id AND b.km_final IS NOT NULL
GROUP BY v.id, v.immatriculation;

-- Recreate daily stats view with proper security
CREATE VIEW public.v_vehicule_daily_stats 
WITH (security_invoker = true) AS
SELECT
  b.vehicule_id,
  v.immatriculation,
  b.closed_at_date AS jour,
  SUM(b.distance) AS km_total,
  SUM(b.montant) AS cout_tnd,
  SUM(
    CASE 
      WHEN cp.prix > 0 THEN b.montant / cp.prix 
      ELSE 0 
    END
  ) AS litres_total,
  CASE
    WHEN SUM(b.distance) > 0
      THEN (100.0 * SUM(CASE WHEN cp.prix > 0 THEN b.montant / cp.prix ELSE 0 END) / SUM(b.distance))
    ELSE NULL
  END AS l_per_100km
FROM public.bons b
JOIN public.vehicules v ON v.id = b.vehicule_id
LEFT JOIN public.carburant_parameters cp ON cp.type = b.type
WHERE b.closed_at_date IS NOT NULL AND b.distance IS NOT NULL AND b.distance > 0
GROUP BY b.vehicule_id, v.immatriculation, b.closed_at_date
ORDER BY b.closed_at_date DESC;

-- Fix function search paths
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
$$ LANGUAGE plpgsql SET search_path = '';

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
$$ LANGUAGE plpgsql SET search_path = '';