// Types pour l'application de traçabilité des bons

export type BonType = 'gasoil' | 'especes';

export type BonStatus = 'draft' | 'completed' | 'validated';

export interface Bon {
  id: string;
  numero: string;
  date: string;
  type: BonType;
  montant: number;
  chauffeurId: string;
  vehiculeId: string;
  kmInitial?: number;
  kmFinal?: number;
  distance?: number;
  status: BonStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  telephone: string;
  statut: 'actif' | 'inactif';
  createdAt: string;
  updatedAt: string;
}

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  statut: 'actif' | 'inactif';
  consommationReference?: number; // L/100km
  coutKmReference?: number; // €/km
  createdAt: string;
  updatedAt: string;
}

export type AnomalieType = 
  | 'km_invalide'
  | 'recul_kilometrique'
  | 'distance_incoherente'
  | 'montant_incoherent'
  | 'bon_incomplet'
  | 'doublon_numero'
  | 'frequence_anormale';

export type AnomalieGravite = 'faible' | 'moyenne' | 'elevee' | 'critique';

export type AnomalieStatut = 'a_verifier' | 'en_cours' | 'justifiee' | 'fraude';

export interface Anomalie {
  id: string;
  bonId: string;
  type: AnomalieType;
  gravite: AnomalieGravite;
  scoreRisque: number; // 0-100
  details: string;
  statut: AnomalieStatut;
  commentaires?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BonFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: BonType;
  chauffeurId?: string;
  vehiculeId?: string;
  status?: BonStatus;
  search?: string;
}

export interface Statistics {
  totalMontant: number;
  totalDistance: number;
  totalBons: number;
  montantGasoil: number;
  montantEspeces: number;
  anomaliesCount: number;
}