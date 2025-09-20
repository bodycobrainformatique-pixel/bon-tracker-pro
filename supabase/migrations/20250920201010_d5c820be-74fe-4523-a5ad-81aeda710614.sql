-- Enable realtime for all tables to ensure proper real-time synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.bons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chauffeurs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalies;

-- Enable row level security realtime for all tables
ALTER TABLE public.bons REPLICA IDENTITY FULL;
ALTER TABLE public.vehicules REPLICA IDENTITY FULL;
ALTER TABLE public.chauffeurs REPLICA IDENTITY FULL;
ALTER TABLE public.anomalies REPLICA IDENTITY FULL;