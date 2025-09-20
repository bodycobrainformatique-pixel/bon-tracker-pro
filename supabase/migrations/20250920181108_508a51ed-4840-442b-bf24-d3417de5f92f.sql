-- Create carburant_parameters table for fuel pricing
CREATE TABLE IF NOT EXISTS public.carburant_parameters (
  type TEXT PRIMARY KEY CHECK (type IN ('essence', 'gasoil', 'gasoil_50')),
  prix DECIMAL(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carburant_parameters ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage fuel parameters" 
ON public.carburant_parameters 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default fuel types with initial prices
INSERT INTO public.carburant_parameters (type, prix) VALUES
  ('essence', 2.200),
  ('gasoil', 2.100),
  ('gasoil_50', 2.050)
ON CONFLICT (type) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_carburant_parameters_updated_at
BEFORE UPDATE ON public.carburant_parameters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();