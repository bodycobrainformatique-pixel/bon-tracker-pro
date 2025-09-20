// Données de seed pour initialiser l'application

import { Bon, Chauffeur, Vehicule, Anomalie } from '@/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const seedChauffeurs: Chauffeur[] = [
  {
    id: 'chauffeur_1',
    nom: 'Ben Ahmed',
    prenom: 'Mohamed',
    matricule: 'CHAUF001',
    telephone: '+216 98 123 456',
    email: 'mohamed.benahmed@email.tn',
    adresse: 'Rue de la République, Tunis 1001',
    dateNaissance: '1985-03-15',
    cinNumber: '12345678',
    permisNumber: 'P123456789',
    dateEmbauche: '2022-01-15',
    salaire: 1200,
    statut: 'actif',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'chauffeur_2',
    nom: 'Trabelsi',
    prenom: 'Fatima',
    matricule: 'CHAUF002',
    telephone: '+216 22 987 654',
    email: 'fatima.trabelsi@email.tn',
    adresse: 'Avenue Bourguiba, Sfax 3000',
    dateNaissance: '1990-07-22',
    cinNumber: '23456789',
    permisNumber: 'P987654321',
    dateEmbauche: '2023-02-01',
    salaire: 1100,
    statut: 'actif',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'chauffeur_3',
    nom: 'Sassi',
    prenom: 'Karim',
    matricule: 'CHAUF003',
    telephone: '+216 55 444 333',
    email: 'karim.sassi@email.tn',
    adresse: 'Route de Sousse, Monastir 5000',
    dateNaissance: '1982-12-10',
    cinNumber: '34567890',
    permisNumber: 'P555444333',
    dateEmbauche: '2021-01-10',
    salaire: 1300,
    statut: 'inactif',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString()
  }
];

export const seedVehicules: Vehicule[] = [
  {
    id: 'vehicule_1',
    immatriculation: '123 TUN 4567',
    marque: 'Renault',
    modele: 'Master',
    annee: 2020,
    couleur: 'Blanc',
    typeCarburant: 'gasoil',
    capaciteReservoir: 80,
    kilometrage: 45380,
    dateAchat: '2020-03-15',
    prixAchat: 45000,
    numeroSerie: 'VF1MA000012345678',
    statut: 'actif',
    consommationReference: 8.5,
    coutKmReference: 0.85,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString()
  },
  {
    id: 'vehicule_2',
    immatriculation: '456 TUN 7890',
    marque: 'Ford',
    modele: 'Transit',
    annee: 2019,
    couleur: 'Bleu',
    typeCarburant: 'gasoil',
    capaciteReservoir: 75,
    kilometrage: 78520,
    dateAchat: '2019-05-20',
    prixAchat: 42000,
    numeroSerie: 'WF0XXXTTGXKG123456',
    statut: 'actif',
    consommationReference: 9.2,
    coutKmReference: 0.92,
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString()
  },
  {
    id: 'vehicule_3',
    immatriculation: '789 TUN 1234',
    marque: 'Mercedes',
    modele: 'Sprinter',
    annee: 2021,
    couleur: 'Gris',
    typeCarburant: 'gasoil',
    capaciteReservoir: 90,
    kilometrage: 12850,
    dateAchat: '2021-08-10',
    prixAchat: 55000,
    numeroSerie: 'WDF90612345678901',
    statut: 'actif',
    consommationReference: 7.8,
    coutKmReference: 0.78,
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
    montant: 245.50,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_1',
    kmInitial: 45230,
    kmFinal: 45380,
    distance: 150,
    notes: 'Livraison Tunis-Sfax',
    createdAt: new Date('2024-09-15T08:30:00').toISOString(),
    updatedAt: new Date('2024-09-15T18:30:00').toISOString()
  },
  {
    id: 'bon_2',
    numero: 'BON002',
    date: new Date('2024-09-16').toISOString().split('T')[0],
    type: 'essence',
    montant: 85.00,
    chauffeurId: 'chauffeur_2',
    vehiculeId: 'vehicule_2',
    kmInitial: 78450,
    kmFinal: 78520,
    distance: 70,
    notes: 'Frais de péage autoroute',
    createdAt: new Date('2024-09-16T09:15:00').toISOString(),
    updatedAt: new Date('2024-09-16T17:45:00').toISOString()
  },
  {
    id: 'bon_3',
    numero: 'BON003',
    date: new Date('2024-09-17').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 320.00,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_3',
    kmInitial: 12850,
    notes: 'En cours - Tunis-Sousse',
    createdAt: new Date('2024-09-17T07:00:00').toISOString(),
    updatedAt: new Date('2024-09-17T07:00:00').toISOString()
  },
  {
    id: 'bon_4',
    numero: 'BON004',
    date: new Date('2024-09-18').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 280.00,
    chauffeurId: 'chauffeur_2',
    vehiculeId: 'vehicule_1',
    kmInitial: 45380,
    kmFinal: 45320, // Anomalie : recul kilométrique
    distance: -60,
    createdAt: new Date('2024-09-18T10:30:00').toISOString(),
    updatedAt: new Date('2024-09-18T16:30:00').toISOString()
  },
  {
    id: 'bon_5',
    numero: 'BON005',
    date: new Date('2024-09-19').toISOString().split('T')[0],
    type: 'gasoil_50',
    montant: 150.00,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_2',
    kmInitial: 78520,
    kmFinal: 78720,
    distance: 200,
    notes: 'Mission Monastir-Kairouan',
    createdAt: new Date('2024-09-19T08:00:00').toISOString(),
    updatedAt: new Date('2024-09-19T19:00:00').toISOString()
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