// Données de seed pour initialiser l'application

import { Bon, Chauffeur, Vehicule, Anomalie } from '@/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const seedChauffeurs: Chauffeur[] = [
  {
    id: 'chauffeur_1',
    nom: 'Dupont',
    prenom: 'Jean',
    matricule: 'MAT001',
    telephone: '06 12 34 56 78',
    statut: 'actif',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'chauffeur_2',
    nom: 'Martin',
    prenom: 'Pierre',
    matricule: 'MAT002',
    telephone: '06 98 76 54 32',
    statut: 'actif',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'chauffeur_3',
    nom: 'Moreau',
    prenom: 'Sophie',
    matricule: 'MAT003',
    telephone: '06 55 44 33 22',
    statut: 'inactif',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString()
  }
];

export const seedVehicules: Vehicule[] = [
  {
    id: 'vehicule_1',
    immatriculation: 'AB-123-CD',
    marque: 'Renault',
    modele: 'Master',
    statut: 'actif',
    consommationReference: 8.5,
    coutKmReference: 0.35,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString()
  },
  {
    id: 'vehicule_2',
    immatriculation: 'EF-456-GH',
    marque: 'Ford',
    modele: 'Transit',
    statut: 'actif',
    consommationReference: 9.2,
    coutKmReference: 0.42,
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString()
  },
  {
    id: 'vehicule_3',
    immatriculation: 'IJ-789-KL',
    marque: 'Mercedes',
    modele: 'Sprinter',
    statut: 'actif',
    consommationReference: 7.8,
    coutKmReference: 0.38,
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  }
];

export const seedBons: Bon[] = [
  {
    id: 'bon_1',
    numero: 'BON001',
    date: new Date('2024-09-15').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 85.50,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_1',
    kmInitial: 45230,
    kmFinal: 45380,
    distance: 150,
    status: 'completed',
    notes: 'Livraison Lyon',
    createdAt: new Date('2024-09-15T08:30:00').toISOString(),
    updatedAt: new Date('2024-09-15T18:30:00').toISOString()
  },
  {
    id: 'bon_2',
    numero: 'BON002',
    date: new Date('2024-09-16').toISOString().split('T')[0],
    type: 'especes',
    montant: 45.00,
    chauffeurId: 'chauffeur_2',
    vehiculeId: 'vehicule_2',
    kmInitial: 78450,
    kmFinal: 78520,
    distance: 70,
    status: 'completed',
    notes: 'Frais de péage',
    createdAt: new Date('2024-09-16T09:15:00').toISOString(),
    updatedAt: new Date('2024-09-16T17:45:00').toISOString()
  },
  {
    id: 'bon_3',
    numero: 'BON003',
    date: new Date('2024-09-17').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 120.00,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_3',
    kmInitial: 12850,
    status: 'draft',
    notes: 'En cours - Marseille',
    createdAt: new Date('2024-09-17T07:00:00').toISOString(),
    updatedAt: new Date('2024-09-17T07:00:00').toISOString()
  },
  {
    id: 'bon_4',
    numero: 'BON004',
    date: new Date('2024-09-18').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 150.00,
    chauffeurId: 'chauffeur_2',
    vehiculeId: 'vehicule_1',
    kmInitial: 45380,
    kmFinal: 45320, // Anomalie : recul kilométrique
    distance: -60,
    status: 'completed',
    createdAt: new Date('2024-09-18T10:30:00').toISOString(),
    updatedAt: new Date('2024-09-18T16:30:00').toISOString()
  }
];

export const seedAnomalies: Anomalie[] = [
  {
    id: 'anomalie_1',
    bonId: 'bon_4',
    type: 'recul_kilometrique',
    gravite: 'elevee',
    scoreRisque: 85,
    details: 'Kilométrage final (45320) inférieur au kilométrage initial (45380). Recul de 60 km détecté.',
    statut: 'a_verifier',
    createdAt: new Date('2024-09-18T16:30:00').toISOString(),
    updatedAt: new Date('2024-09-18T16:30:00').toISOString()
  },
  {
    id: 'anomalie_2',
    bonId: 'bon_3',
    type: 'bon_incomplet',
    gravite: 'moyenne',
    scoreRisque: 45,
    details: 'Bon créé il y a plus de 24h sans renseignement du kilométrage final.',
    statut: 'a_verifier',
    createdAt: new Date('2024-09-18T07:00:00').toISOString(),
    updatedAt: new Date('2024-09-18T07:00:00').toISOString()
  }
];