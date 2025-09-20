-- Check current triggers on bons table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'bons';

-- Drop existing triggers if they exist to recreate them properly
DROP TRIGGER IF EXISTS update_previous_bon_km_trigger ON public.bons;
DROP TRIGGER IF EXISTS compute_bon_distance_trigger ON public.bons;

-- Create the trigger to update previous bon's km_final and distance when a new bon is created
CREATE OR REPLACE FUNCTION public.update_previous_bon_km()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  prev_bon_id UUID;
  prev_km_initial NUMERIC;
BEGIN
  -- Only process if this is a new bon with km_initial set
  IF NEW.km_initial IS NOT NULL THEN
    -- Find the previous bon for the same vehicle (most recent before current bon)
    SELECT id, km_initial INTO prev_bon_id, prev_km_initial
    FROM public.bons
    WHERE vehicule_id = NEW.vehicule_id
      AND id != NEW.id
      AND (date < NEW.date OR (date = NEW.date AND numero < NEW.numero))
    ORDER BY date DESC, numero DESC
    LIMIT 1;

    -- Update the previous bon's km_final and distance if found
    IF prev_bon_id IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger to compute distance for the current bon
CREATE OR REPLACE FUNCTION public.compute_bon_distance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.km_initial IS NOT NULL AND NEW.km_final IS NOT NULL THEN
    NEW.distance := GREATEST(NEW.km_final - NEW.km_initial, 0);
  ELSE
    NEW.distance := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create triggers
CREATE TRIGGER update_previous_bon_km_trigger
  AFTER INSERT OR UPDATE ON public.bons
  FOR EACH ROW
  WHEN (NEW.km_initial IS NOT NULL)
  EXECUTE FUNCTION public.update_previous_bon_km();

CREATE TRIGGER compute_bon_distance_trigger
  BEFORE INSERT OR UPDATE ON public.bons
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_bon_distance();