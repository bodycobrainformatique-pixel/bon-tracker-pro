-- Fix vehicle fuel type constraints to match requirements
ALTER TABLE public.vehicules DROP CONSTRAINT IF EXISTS vehicules_type_carburant_check;
ALTER TABLE public.vehicules ADD CONSTRAINT vehicules_type_carburant_check 
  CHECK (type_carburant IN ('essence', 'gasoil', 'gasoil50'));

-- Simplify chauffeurs table - remove unnecessary fields
ALTER TABLE public.chauffeurs DROP COLUMN IF EXISTS salaire_base;
ALTER TABLE public.chauffeurs DROP COLUMN IF EXISTS date_naissance;
ALTER TABLE public.chauffeurs DROP COLUMN IF EXISTS date_embauche;
ALTER TABLE public.chauffeurs ALTER COLUMN adresse DROP NOT NULL;
ALTER TABLE public.chauffeurs ALTER COLUMN cin DROP NOT NULL;

-- Update carburant_parameters to match fuel types
DELETE FROM public.carburant_parameters WHERE type NOT IN ('essence', 'gasoil', 'gasoil50');
ALTER TABLE public.carburant_parameters DROP CONSTRAINT IF EXISTS carburant_parameters_type_check;
ALTER TABLE public.carburant_parameters ADD CONSTRAINT carburant_parameters_type_check 
  CHECK (type IN ('essence', 'gasoil', 'gasoil50'));

-- Insert default fuel prices if not exists
INSERT INTO public.carburant_parameters (type, prix) 
VALUES 
  ('essence', 2.400),
  ('gasoil', 2.200), 
  ('gasoil50', 2.100)
ON CONFLICT (type) DO NOTHING;

-- Add triggers for automatic bon distance calculation
CREATE OR REPLACE FUNCTION public.update_previous_bon_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  prev_bon_record RECORD;
BEGIN
  -- Only process if km_initial is provided
  IF NEW.km_initial IS NOT NULL THEN
    -- Find the most recent previous bon for the same vehicle
    SELECT id, km_initial INTO prev_bon_record
    FROM public.bons
    WHERE vehicule_id = NEW.vehicule_id
      AND id != NEW.id
      AND (date < NEW.date OR (date = NEW.date AND numero < NEW.numero))
    ORDER BY date DESC, numero DESC
    LIMIT 1;

    -- Update the previous bon if found
    IF prev_bon_record.id IS NOT NULL THEN
      UPDATE public.bons
      SET 
        km_final = NEW.km_initial,
        distance = CASE
          WHEN prev_bon_record.km_initial IS NOT NULL 
          THEN GREATEST(NEW.km_initial - prev_bon_record.km_initial, 0)
          ELSE NULL
        END,
        updated_at = now()
      WHERE id = prev_bon_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic previous bon update
DROP TRIGGER IF EXISTS trigger_update_previous_bon ON public.bons;
CREATE TRIGGER trigger_update_previous_bon
  AFTER INSERT OR UPDATE OF km_initial ON public.bons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_previous_bon_on_insert();

-- Create view for vehicle daily statistics
CREATE OR REPLACE VIEW public.v_vehicle_daily_stats AS
SELECT 
  b.vehicule_id,
  v.immatriculation,
  b.date,
  SUM(b.distance) as km_total,
  SUM(b.montant / cp.prix) as litres_total,
  SUM(b.montant) as cout_tnd,
  CASE 
    WHEN SUM(b.distance) > 0 
    THEN ROUND((SUM(b.montant / cp.prix) / SUM(b.distance) * 100)::numeric, 2)
    ELSE NULL 
  END as l_per_100km
FROM public.bons b
JOIN public.vehicules v ON b.vehicule_id = v.id
JOIN public.carburant_parameters cp ON b.type = cp.type
WHERE b.distance IS NOT NULL AND b.distance > 0
GROUP BY b.vehicule_id, v.immatriculation, b.date, cp.prix
ORDER BY b.date DESC;

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chauffeurs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carburant_parameters;