-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create chauffeurs table
CREATE TABLE public.chauffeurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cin TEXT NOT NULL UNIQUE,
  telephone TEXT NOT NULL,
  email TEXT,
  adresse TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  date_embauche DATE NOT NULL,
  salaire_base DECIMAL(10,2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;

-- Create vehicules table
CREATE TABLE public.vehicules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  immatriculation TEXT NOT NULL UNIQUE,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER NOT NULL,
  couleur TEXT NOT NULL,
  type_carburant TEXT NOT NULL CHECK (type_carburant IN ('gasoil', 'essence', 'hybride', 'electrique')),
  capacite_reservoir DECIMAL(8,2) NOT NULL,
  kilometrage DECIMAL(10,2) NOT NULL DEFAULT 0,
  date_mise_en_service DATE NOT NULL,
  cout_acquisition DECIMAL(12,2) NOT NULL,
  cout_maintenance_annuel DECIMAL(10,2) DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_service' CHECK (statut IN ('en_service', 'en_panne', 'en_maintenance', 'hors_service')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;

-- Create bons table
CREATE TABLE public.bons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gasoil', 'especes')),
  montant DECIMAL(10,2) NOT NULL,
  distance DECIMAL(8,2),
  chauffeur_id UUID NOT NULL REFERENCES public.chauffeurs(id) ON DELETE RESTRICT,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'valide', 'annule')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bons ENABLE ROW LEVEL SECURITY;

-- Create anomalies table
CREATE TABLE public.anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('consommation_elevee', 'distance_incoherente', 'duree_anormale', 'montant_suspect', 'frequence_elevee')),
  description TEXT NOT NULL,
  severite TEXT NOT NULL CHECK (severite IN ('faible', 'moyenne', 'elevee')),
  statut TEXT NOT NULL DEFAULT 'a_verifier' CHECK (statut IN ('a_verifier', 'resolue', 'ignoree')),
  bon_id UUID REFERENCES public.bons(id) ON DELETE CASCADE,
  chauffeur_id UUID REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  vehicule_id UUID REFERENCES public.vehicules(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
-- Profiles policies
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin access policies (for now, all authenticated users are admins)
CREATE POLICY "Authenticated users can manage chauffeurs" 
ON public.chauffeurs FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage vehicules" 
ON public.vehicules FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage bons" 
ON public.bons FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage anomalies" 
ON public.anomalies FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chauffeurs_updated_at
  BEFORE UPDATE ON public.chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicules_updated_at
  BEFORE UPDATE ON public.vehicules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bons_updated_at
  BEFORE UPDATE ON public.bons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anomalies_updated_at
  BEFORE UPDATE ON public.anomalies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();