import { Bon, Chauffeur, Vehicule, Anomalie, CarburantParameter } from '@/types';

// Données de test pour les chauffeurs
export const chauffeurs: Chauffeur[] = [
  {
    id: 'chauffeur_1',
    nom: 'Benali',
    prenom: 'Ahmed',
    matricule: '12345678',
    telephone: '+216 98 123 456',
    email: 'ahmed.benali@example.com',
    adresse: 'Tunis, Tunisia',
    statut: 'actif',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'chauffeur_2',
    nom: 'Sassi',
    prenom: 'Mohamed',
    matricule: '87654321',
    telephone: '+216 97 654 321',
    email: 'mohamed.sassi@example.com',
    adresse: 'Sfax, Tunisia',
    statut: 'actif',
    createdAt: new Date('2024-02-20').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString()
  },
  {
    id: 'chauffeur_3',
    nom: 'Trabelsi',
    prenom: 'Karim',
    matricule: '11223344',
    telephone: '+216 99 876 543',
    email: 'karim.trabelsi@example.com',
    adresse: 'Sousse, Tunisia',
    statut: 'inactif',
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date('2024-03-10').toISOString()
  }
];

// Données de test pour les véhicules
export const vehicules: Vehicule[] = [
  {
    id: 'vehicule_1',
    immatriculation: '123 TUN 1234',
    marque: 'Renault',
    modele: 'Clio',
    annee: 2020,
    couleur: 'Blanc',
    typeCarburant: 'gasoil',
    capaciteReservoir: 45,
    kilometrage: 85000,
    dateAchat: '2020-03-15',
    prixAchat: 25000,
    numeroSerie: 'VF1RH000123456789',
    statut: 'en_service',
    consommationReference: 6.5,
    coutKmReference: 0.45,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString()
  },
  {
    id: 'vehicule_2',
    immatriculation: '456 TUN 5678',
    marque: 'Peugeot',
    modele: '208',
    annee: 2019,
    couleur: 'Rouge',
    typeCarburant: 'essence',
    capaciteReservoir: 50,
    kilometrage: 78000,
    dateAchat: '2019-07-20',
    prixAchat: 28000,
    numeroSerie: 'VF3CH000987654321',
    statut: 'en_service',
    consommationReference: 5.8,
    coutKmReference: 0.52,
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString()
  },
  {
    id: 'vehicule_3',
    immatriculation: '789 TUN 9012',
    marque: 'Toyota',
    modele: 'Corolla',
    annee: 2021,
    couleur: 'Gris',
    typeCarburant: 'gasoil50',
    capaciteReservoir: 55,
    kilometrage: 45000,
    dateAchat: '2021-01-15',
    prixAchat: 35000,
    numeroSerie: 'JTDBT000555444333',
    statut: 'en_service',
    consommationReference: 4.2,
    coutKmReference: 0.38,
    createdAt: new Date('2024-01-14').toISOString(),
    updatedAt: new Date('2024-01-14').toISOString()
  }
];

// Données de test pour les bons
export const bons: Bon[] = [
  {
    id: 'bon_1',
    numero: 'BON001',
    date: new Date('2024-09-15').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 120.50,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_1',
    kmInitial: 84520,
    kmFinal: 84720,
    distance: 200,
    notes: 'Mission Tunis-Sfax',
    createdAt: new Date('2024-09-15T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-09-15T08:00:00Z').toISOString()
  },
  {
    id: 'bon_2',
    numero: 'BON002',
    date: new Date('2024-09-16').toISOString().split('T')[0],
    type: 'essence',
    montant: 95.75,
    chauffeurId: 'chauffeur_2',
    vehiculeId: 'vehicule_2',
    kmInitial: 77800,
    kmFinal: 78000,
    distance: 200,
    notes: 'Livraison urgente',
    createdAt: new Date('2024-09-16T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-09-16T10:30:00Z').toISOString()
  },
  {
    id: 'bon_3',
    numero: 'BON003',
    date: new Date('2024-09-17').toISOString().split('T')[0],
    type: 'gasoil',
    montant: 200.00,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_1',
    kmInitial: 84720,
    kmFinal: 85000,
    distance: 280,
    notes: 'Transport de marchandises',
    createdAt: new Date('2024-09-17T14:15:00Z').toISOString(),
    updatedAt: new Date('2024-09-17T14:15:00Z').toISOString()
  },
  {
    id: 'bon_4',
    numero: 'BON004',
    date: new Date('2024-09-18').toISOString().split('T')[0],
    type: 'essence',
    montant: 78.25,
    chauffeurId: 'chauffeur_2',
    vehiculeId: 'vehicule_2',
    kmInitial: 78000,
    kmFinal: 78150,
    distance: 150,
    notes: 'Réunion client',
    createdAt: new Date('2024-09-18T09:45:00Z').toISOString(),
    updatedAt: new Date('2024-09-18T09:45:00Z').toISOString()
  },
  {
    id: 'bon_5',
    numero: 'BON005',
    date: new Date('2024-09-19').toISOString().split('T')[0],
    type: 'gasoil50',
    montant: 150.00,
    chauffeurId: 'chauffeur_1',
    vehiculeId: 'vehicule_3',
    kmInitial: 44520,
    kmFinal: 44720,
    distance: 200,
    notes: 'Mission Monastir-Kairouan',
    createdAt: new Date('2024-09-19T11:20:00Z').toISOString(),
    updatedAt: new Date('2024-09-19T11:20:00Z').toISOString()
  }
];

// Paramètres carburant
export const carburantParameters: CarburantParameter[] = [
  {
    type: 'gasoil',
    prix: 2.200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'essence',
    prix: 2.400,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'gasoil50',
    prix: 2.100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Anomalies de test
export const anomalies: Anomalie[] = [
  {
    id: 'anomalie_1',
    bonId: 'bon_1',
    type: 'distance_incoherente',
    gravite: 'moyenne',
    scoreRisque: 65,
    details: 'Distance parcourue supérieure à la normale pour ce type de mission',
    statut: 'a_verifier',
    createdAt: new Date('2024-09-15T20:00:00Z').toISOString(),
    updatedAt: new Date('2024-09-15T20:00:00Z').toISOString()
  },
  {
    id: 'anomalie_2',
    bonId: 'bon_2',
    type: 'montant_incoherent',
    gravite: 'faible',
    scoreRisque: 30,
    details: 'Montant légèrement supérieur au prix habituel du carburant',
    statut: 'justifiee',
    commentaires: 'Station service premium',
    createdAt: new Date('2024-09-16T21:30:00Z').toISOString(),
    updatedAt: new Date('2024-09-16T21:30:00Z').toISOString()
  }
];