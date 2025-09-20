-- Create trigger to automatically calculate previous bon's distance when a new bon is inserted
CREATE TRIGGER trigger_update_previous_bon_km
  AFTER INSERT ON public.bons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_previous_bon_km();