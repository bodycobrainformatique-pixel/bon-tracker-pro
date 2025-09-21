// Types pour l'application de gestion du parc automobile

export type BonType = 'gasoil' | 'essence' | 'gasoil50';

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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  matricule: string; // CIN or employee ID
  telephone: string;
  email?: string;
  adresse?: string;
  statut: 'actif' | 'inactif';
  createdAt: string;
  updatedAt: string;
}

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee?: number;
  couleur?: string;
  typeCarburant?: 'gasoil' | 'essence' | 'gasoil50';
  capaciteReservoir?: number; // en litres
  kilometrage?: number; // km actuel
  dateAchat?: string;
  prixAchat?: number; // en TND
  numeroSerie?: string;
  statut: 'en_service' | 'hors_service';
  consommationReference?: number; // L/100km
  coutKmReference?: number; // TND/km
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
  search?: string;
}

export interface Statistics {
  totalMontant: number;
  totalDistance: number;
  totalBons: number;
  montantGasoil: number;
  montantEssence: number;
  montantGasoil50: number;
  anomaliesCount: number;
}

export interface CarburantParameter {
  type: BonType;
  prix: number;
  createdAt: string;
  updatedAt: string;
}