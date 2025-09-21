// Test file to verify anomaly detection logic
import { detectAnomalies } from './anomaliesDetection';
import { Bon, Chauffeur, Vehicule } from '@/types';

// Test data
const testChauffeurs: Chauffeur[] = [
  {
    id: 'chauffeur-1',
    nom: 'Dupont',
    prenom: 'Jean',
    matricule: 'CH001',
    telephone: '123456789',
    email: 'jean@test.com',
    adresse: 'Test Address',
    statut: 'actif',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const testVehicules: Vehicule[] = [
  {
    id: 'vehicule-1',
    immatriculation: 'TUN1234',
    marque: 'Toyota',
    modele: 'Corolla',
    typeCarburant: 'gasoil',
    statut: 'en_service',
    coutKmReference: 0.5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Test ISSUED bon (no km_initial)
const testBonIssued: Bon = {
  id: 'bon-1',
  numero: 'B001',
  date: '2024-01-01',
  type: 'gasoil',
  montant: 50,
  chauffeurId: 'chauffeur-1',
  vehiculeId: 'vehicule-1',
  kmInitial: null, // ISSUED phase
  kmFinal: null,
  distance: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// Test IN_USE bon (has km_initial but no km_final)
const testBonInUse: Bon = {
  id: 'bon-2',
  numero: 'B002',
  date: '2024-01-02',
  type: 'gasoil',
  montant: 50,
  chauffeurId: 'chauffeur-1',
  vehiculeId: 'vehicule-1',
  kmInitial: 1000, // IN_USE phase
  kmFinal: null,
  distance: null,
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z'
};

// Test CLOSED bon (has both km_initial and km_final)
const testBonClosed: Bon = {
  id: 'bon-3',
  numero: 'B003',
  date: '2024-01-03',
  type: 'gasoil',
  montant: 50,
  chauffeurId: 'chauffeur-1',
  vehiculeId: 'vehicule-1',
  kmInitial: 1100,
  kmFinal: 1200, // CLOSED phase
  distance: 100,
  createdAt: '2024-01-03T00:00:00Z',
  updatedAt: '2024-01-03T00:00:00Z'
};

// Run tests
export const runAnomalyDetectionTests = () => {
  console.log('🧪 Running anomaly detection tests...');

  // Test 1: ISSUED bon should only check for duplicates
  const issuedAnomalies = detectAnomalies(testBonIssued, [], testChauffeurs, testVehicules);
  console.log('✅ Test 1 - ISSUED bon anomalies:', issuedAnomalies);
  console.assert(issuedAnomalies.length === 0, 'ISSUED bon should have no anomalies when no duplicates');

  // Test 2: IN_USE bon should only check for duplicates  
  const inUseAnomalies = detectAnomalies(testBonInUse, [testBonIssued], testChauffeurs, testVehicules);
  console.log('✅ Test 2 - IN_USE bon anomalies:', inUseAnomalies);
  console.assert(inUseAnomalies.length === 0, 'IN_USE bon should have no distance-based anomalies');

  // Test 3: CLOSED bon should run full checks
  const closedAnomalies = detectAnomalies(testBonClosed, [testBonIssued, testBonInUse], testChauffeurs, testVehicules);
  console.log('✅ Test 3 - CLOSED bon anomalies:', closedAnomalies);
  
  // Test 4: Duplicate numero should be detected in any phase
  const duplicateBon = { ...testBonIssued, id: 'bon-duplicate' };
  const duplicateAnomalies = detectAnomalies(duplicateBon, [testBonIssued], testChauffeurs, testVehicules);
  console.log('✅ Test 4 - Duplicate numero anomalies:', duplicateAnomalies);
  console.assert(duplicateAnomalies.length === 1 && duplicateAnomalies[0].type === 'doublon_numero', 'Duplicate numero should be detected');

  console.log('🎉 All anomaly detection tests completed!');
};

// Auto-run tests in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setTimeout(runAnomalyDetectionTests, 1000);
}