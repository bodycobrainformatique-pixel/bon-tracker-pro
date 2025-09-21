-- Maintenance Module Database Schema
-- Create maintenance tables with proper relationships and RLS

-- 1. Maintenance Tasks (templates)
CREATE TABLE public.maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('preventive', 'corrective')),
  interval_km INTEGER,
  interval_jours INTEGER,
  duree_estimee_min INTEGER,
  pieces_defaut JSONB,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Maintenance Plans (assign templates to vehicles)
CREATE TABLE public.maintenance_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  start_km INTEGER NOT NULL,
  last_done_date DATE,
  last_done_km INTEGER,
  next_due_date DATE,
  next_due_km INTEGER,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicule_id, task_id)
);

-- 3. Vendors (prestataires)
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Parts Catalog
CREATE TABLE public.parts_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  unite TEXT NOT NULL DEFAULT 'pcs',
  prix NUMERIC(12,3),
  vendor_id UUID REFERENCES public.vendors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Maintenance Work Orders
CREATE TABLE public.maintenance_work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.maintenance_plans(id) ON DELETE SET NULL,
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  due_date DATE,
  due_km INTEGER,
  priorite TEXT NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute')),
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours', 'termine', 'annule')),
  assigned_to TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Maintenance Events (execution history)
CREATE TABLE public.maintenance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.maintenance_work_orders(id) ON DELETE CASCADE,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  date_realisation DATE NOT NULL,
  odometre_km INTEGER NOT NULL,
  commentaire TEXT,
  cout_main_oeuvre NUMERIC(12,3) DEFAULT 0,
  cout_pieces NUMERIC(12,3) DEFAULT 0,
  cout_total NUMERIC(12,3) GENERATED ALWAYS AS (COALESCE(cout_main_oeuvre, 0) + COALESCE(cout_pieces, 0)) STORED,
  pieces_utilisees JSONB,
  fichiers JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Parts Usage (parts consumed per work order)
CREATE TABLE public.parts_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.maintenance_work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
  quantite NUMERIC(12,3) NOT NULL,
  prix_unitaire NUMERIC(12,3),
  total_cost NUMERIC(12,3) GENERATED ALWAYS AS (COALESCE(quantite, 0) * COALESCE(prix_unitaire, 0)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_bons_vehicule_date_numero ON public.bons(vehicule_id, date, numero);
CREATE INDEX idx_maintenance_plans_vehicule ON public.maintenance_plans(vehicule_id);
CREATE INDEX idx_maintenance_work_orders_vehicule_statut_date ON public.maintenance_work_orders(vehicule_id, statut, due_date);
CREATE INDEX idx_maintenance_events_vehicule_date ON public.maintenance_events(vehicule_id, date_realisation);
CREATE INDEX idx_maintenance_work_orders_due_date ON public.maintenance_work_orders(due_date) WHERE statut IN ('ouvert', 'en_cours');
CREATE INDEX idx_maintenance_work_orders_due_km ON public.maintenance_work_orders(due_km) WHERE statut IN ('ouvert', 'en_cours');

-- Helper view: Current vehicle odometer
CREATE VIEW public.vehicules_current_odometer AS
SELECT 
  v.id as vehicule_id,
  v.immatriculation,
  COALESCE(
    GREATEST(
      COALESCE(MAX(b.km_final), 0),
      COALESCE(MAX(b.km_initial), 0)
    ), 
    0
  ) as current_km
FROM public.vehicules v
LEFT JOIN public.bons b ON v.id = b.vehicule_id
GROUP BY v.id, v.immatriculation;

-- Function: Recompute maintenance plan next due dates
CREATE OR REPLACE FUNCTION public.maintenance_recompute_plan(plan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_record RECORD;
BEGIN
  -- Get the plan details
  SELECT * INTO plan_record
  FROM maintenance_plans mp
  JOIN maintenance_tasks mt ON mp.task_id = mt.id
  WHERE mp.id = plan_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Update next_due_km if interval_km is set
  IF plan_record.interval_km IS NOT NULL THEN
    UPDATE maintenance_plans
    SET next_due_km = COALESCE(last_done_km, start_km) + plan_record.interval_km,
        updated_at = now()
    WHERE id = plan_id;
  END IF;
  
  -- Update next_due_date if interval_jours is set  
  IF plan_record.interval_jours IS NOT NULL THEN
    UPDATE maintenance_plans
    SET next_due_date = COALESCE(last_done_date, start_date) + (plan_record.interval_jours || ' days')::INTERVAL,
        updated_at = now()
    WHERE id = plan_id;
  END IF;
END;
$$;

-- Function: Check and create due maintenance work orders
CREATE OR REPLACE FUNCTION public.maintenance_check_due(vehicule_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_record RECORD;
  current_km INTEGER;
  is_overdue BOOLEAN;
BEGIN
  -- Get current odometer for the vehicle
  SELECT vco.current_km INTO current_km
  FROM vehicules_current_odometer vco
  WHERE vco.vehicule_id = maintenance_check_due.vehicule_id;
  
  IF current_km IS NULL THEN
    current_km := 0;
  END IF;
  
  -- Check each active plan for this vehicle
  FOR plan_record IN 
    SELECT mp.*, mt.interval_km, mt.interval_jours
    FROM maintenance_plans mp
    JOIN maintenance_tasks mt ON mp.task_id = mt.id
    WHERE mp.vehicule_id = maintenance_check_due.vehicule_id
    AND mp.statut = 'actif'
    AND mt.actif = true
  LOOP
    -- Recompute the plan's next due dates
    PERFORM maintenance_recompute_plan(plan_record.id);
    
    -- Get updated plan data
    SELECT next_due_km, next_due_date INTO plan_record.next_due_km, plan_record.next_due_date
    FROM maintenance_plans
    WHERE id = plan_record.id;
    
    -- Check if maintenance is due (km or date based)
    is_overdue := false;
    
    IF (plan_record.next_due_km IS NOT NULL AND current_km >= plan_record.next_due_km) OR
       (plan_record.next_due_date IS NOT NULL AND CURRENT_DATE >= plan_record.next_due_date) THEN
      
      -- Check if there's already an open work order for this plan
      IF NOT EXISTS (
        SELECT 1 FROM maintenance_work_orders
        WHERE plan_id = plan_record.id
        AND statut IN ('ouvert', 'en_cours')
      ) THEN
        
        -- Determine if it's overdue (high priority)
        is_overdue := (plan_record.next_due_date IS NOT NULL AND CURRENT_DATE > plan_record.next_due_date) OR
                      (plan_record.next_due_km IS NOT NULL AND current_km > plan_record.next_due_km);
        
        -- Create the work order
        INSERT INTO maintenance_work_orders (
          vehicule_id,
          plan_id,
          task_id,
          due_date,
          due_km,
          priorite
        ) VALUES (
          plan_record.vehicule_id,
          plan_record.id,
          plan_record.task_id,
          plan_record.next_due_date,
          plan_record.next_due_km,
          CASE WHEN is_overdue THEN 'haute' ELSE 'moyenne' END
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Trigger: Check maintenance due when bons are updated
CREATE OR REPLACE FUNCTION public.maintenance_check_due_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call maintenance check for the vehicle
  PERFORM maintenance_check_due(NEW.vehicule_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_maintenance_check_due
  AFTER INSERT OR UPDATE ON public.bons
  FOR EACH ROW
  EXECUTE FUNCTION maintenance_check_due_trigger();

-- Trigger: Update maintenance plan when event is completed
CREATE OR REPLACE FUNCTION public.maintenance_event_completed_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the related work order to completed
  UPDATE maintenance_work_orders
  SET statut = 'termine',
      updated_at = now()
  WHERE id = NEW.work_order_id;
  
  -- Update the maintenance plan's last done info
  UPDATE maintenance_plans
  SET last_done_date = NEW.date_realisation,
      last_done_km = NEW.odometre_km,
      updated_at = now()
  WHERE id = (
    SELECT plan_id FROM maintenance_work_orders
    WHERE id = NEW.work_order_id
  );
  
  -- Recompute next due dates for the plan
  PERFORM maintenance_recompute_plan((
    SELECT plan_id FROM maintenance_work_orders
    WHERE id = NEW.work_order_id
  ));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_maintenance_event_completed
  AFTER INSERT ON public.maintenance_events
  FOR EACH ROW
  EXECUTE FUNCTION maintenance_event_completed_trigger();

-- Add updated_at triggers for all maintenance tables
CREATE TRIGGER update_maintenance_tasks_updated_at
  BEFORE UPDATE ON public.maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_plans_updated_at
  BEFORE UPDATE ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_catalog_updated_at
  BEFORE UPDATE ON public.parts_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_work_orders_updated_at
  BEFORE UPDATE ON public.maintenance_work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_events_updated_at
  BEFORE UPDATE ON public.maintenance_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_usage_updated_at
  BEFORE UPDATE ON public.parts_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can manage maintenance tasks"
ON public.maintenance_tasks
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage maintenance plans"
ON public.maintenance_plans
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage vendors"
ON public.vendors
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage parts catalog"
ON public.parts_catalog
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage work orders"
ON public.maintenance_work_orders
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage maintenance events"
ON public.maintenance_events
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage parts usage"
ON public.parts_usage
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create storage bucket for maintenance files
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance', 'maintenance', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Maintenance files are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'maintenance');

CREATE POLICY "Authenticated users can upload maintenance files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'maintenance');

CREATE POLICY "Authenticated users can update maintenance files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'maintenance');

CREATE POLICY "Authenticated users can delete maintenance files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'maintenance');