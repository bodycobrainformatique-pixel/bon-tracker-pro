// Types pour le module de maintenance
export interface MaintenanceTask {
  id: string;
  code: string;
  libelle: string;
  type: 'preventive' | 'corrective';
  interval_km?: number;
  interval_jours?: number;
  duree_estimee_min?: number;
  pieces_defaut?: any;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePlan {
  id: string;
  vehicule_id: string;
  task_id: string;
  start_date: string;
  start_km: number;
  last_done_date?: string;
  last_done_km?: number;
  next_due_date?: string;
  next_due_km?: number;
  statut: 'actif' | 'suspendu';
  created_at: string;
  updated_at: string;
  // Relations
  vehicule?: {
    id: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
  };
  task?: MaintenanceTask;
}

export interface Vendor {
  id: string;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  created_at: string;
  updated_at: string;
}

export interface PartsCatalog {
  id: string;
  sku: string;
  nom: string;
  unite: string;
  prix?: number;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface MaintenanceWorkOrder {
  id: string;
  vehicule_id: string;
  plan_id?: string;
  task_id: string;
  due_date?: string;
  due_km?: number;
  priorite: 'basse' | 'moyenne' | 'haute';
  statut: 'ouvert' | 'en_cours' | 'termine' | 'annule';
  assigned_to?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  vehicule?: {
    id: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
  };
  task?: MaintenanceTask;
  plan?: MaintenancePlan;
}

export interface MaintenanceEvent {
  id: string;
  work_order_id: string;
  vehicule_id: string;
  task_id: string;
  date_realisation: string;
  odometre_km: number;
  commentaire?: string;
  cout_main_oeuvre: number;
  cout_pieces: number;
  cout_total: number;
  pieces_utilisees?: any;
  fichiers?: any;
  created_at: string;
  updated_at: string;
  // Relations
  work_order?: MaintenanceWorkOrder;
  vehicule?: {
    id: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
  };
  task?: MaintenanceTask;
}

export interface PartsUsage {
  id: string;
  work_order_id: string;
  part_id: string;
  quantite: number;
  prix_unitaire?: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
  part?: PartsCatalog;
}

export interface MaintenanceKPIs {
  ouverts: number;
  en_retard: number;
  a_venir_7j: number;
  a_venir_500km: number;
  cout_mois_precedent: number;
  cout_annee_courante: number;
}

export interface MaintenanceFilters {
  vehicule_id?: string;
  priorite?: string;
  statut?: string;
  date_from?: string;
  date_to?: string;
  assigned_to?: string;
}