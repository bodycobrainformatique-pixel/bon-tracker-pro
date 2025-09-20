-- Create trigger function to automatically update previous bon's km_final
CREATE OR REPLACE FUNCTION public.update_previous_bon_km()
RETURNS TRIGGER AS $$
DECLARE
  prev_bon_id UUID;
BEGIN
  -- Find the previous bon for the same vehicle (most recent before current bon)
  SELECT id INTO prev_bon_id
  FROM public.bons
  WHERE vehicule_id = NEW.vehicule_id
    AND (date < NEW.date OR (date = NEW.date AND numero < NEW.numero))
  ORDER BY date DESC, numero DESC
  LIMIT 1;

  -- Update the previous bon's km_final and distance if found
  IF prev_bon_id IS NOT NULL AND NEW.km_initial IS NOT NULL THEN
    UPDATE public.bons
    SET km_final = NEW.km_initial,
        distance = CASE
                     WHEN NEW.km_initial IS NOT NULL AND km_initial IS NOT NULL
                     THEN NEW.km_initial - km_initial
                     ELSE NULL
                   END,
        updated_at = now()
    WHERE id = prev_bon_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_update_prev_bon ON public.bons;

-- Create trigger to run after insert
CREATE TRIGGER trg_update_prev_bon
AFTER INSERT ON public.bons
FOR EACH ROW
EXECUTE FUNCTION public.update_previous_bon_km();