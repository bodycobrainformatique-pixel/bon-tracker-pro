// Système de détection automatique d'anomalies

import { Bon, Chauffeur, Vehicule, Anomalie, AnomalieType, AnomalieGravite } from '@/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to determine bon lifecycle phase
const getBonPhase = (bon: Bon): 'ISSUED' | 'IN_USE' | 'CLOSED' => {
  if (bon.kmInitial === undefined && bon.kmFinal === undefined) {
    return 'ISSUED';
  } else if (bon.kmInitial !== undefined && bon.kmFinal === undefined) {
    return 'IN_USE';
  } else {
    return 'CLOSED';
  }
};

export const detectAnomalies = (
  bon: Bon, 
  existingBons: Bon[], 
  chauffeurs: Chauffeur[], 
  vehicules: Vehicule[]
): Anomalie[] => {
  const anomalies: Anomalie[] = [];
  const now = new Date();
  const bonPhase = getBonPhase(bon);

  // Always check for duplicate numero regardless of phase
  const duplicateBon = existingBons.find(b => b.numero === bon.numero && b.id !== bon.id);
  if (duplicateBon) {
    anomalies.push(createAnomalie(
      bon.id,
      'doublon_numero',
      'critique',
      90,
      `Numéro de bon "${bon.numero}" déjà utilisé (bon ${duplicateBon.id}).`
    ));
  }

  // For ISSUED bons, only check for duplicates
  if (bonPhase === 'ISSUED') {
    return anomalies;
  }

  // For IN_USE bons, only check for duplicates (no distance-based checks)
  if (bonPhase === 'IN_USE') {
    return anomalies;
  }

  // For CLOSED bons only, check comprehensive anomalies including distance-based checks
  if (bonPhase === 'CLOSED') {
    // Validation km_final < km_initial
    if (bon.kmInitial !== undefined && bon.kmFinal !== undefined && bon.kmFinal < bon.kmInitial) {
      anomalies.push(createAnomalie(
        bon.id,
        'km_invalide',
        'critique',
        95,
        `Kilométrage final (${bon.kmFinal}) inférieur au kilométrage initial (${bon.kmInitial}). Différence: ${bon.kmInitial - bon.kmFinal} km.`
      ));
    }

    // Détection de recul kilométrique (for CLOSED bons only)
    if (bon.kmInitial !== undefined) {
      const vehiculeBons = existingBons
        .filter(b => b.vehiculeId === bon.vehiculeId && b.id !== bon.id && b.kmFinal !== undefined)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const lastBon = vehiculeBons[0];
      if (lastBon && lastBon.kmFinal !== undefined && bon.kmInitial < lastBon.kmFinal) {
        anomalies.push(createAnomalie(
          bon.id,
          'recul_kilometrique',
          'elevee',
          85,
          `Kilométrage initial (${bon.kmInitial}) inférieur au dernier kilométrage final (${lastBon.kmFinal}) du véhicule. Recul de ${lastBon.kmFinal - bon.kmInitial} km.`
        ));
      }
    }

    // Distance incohérente (only when distance is known)
    if (bon.distance !== undefined) {
      if (bon.distance <= 0) {
        anomalies.push(createAnomalie(
          bon.id,
          'distance_incoherente',
          'elevee',
          80,
          `Distance nulle ou négative: ${bon.distance} km.`
        ));
      } else if (bon.distance > 1000) {
        anomalies.push(createAnomalie(
          bon.id,
          'distance_incoherente',
          'moyenne',
          60,
          `Distance exceptionnellement élevée: ${bon.distance} km.`
        ));
      }
    }

    // Montant incohérent vs distance (only when distance is known)
    const vehicule = vehicules.find(v => v.id === bon.vehiculeId);
    if (bon.distance && vehicule && vehicule.coutKmReference) {
      const coutAttendu = bon.distance * vehicule.coutKmReference;
      const ecart = Math.abs(bon.montant - coutAttendu);
      const pourcentageEcart = (ecart / coutAttendu) * 100;

      if (pourcentageEcart > 50) {
        anomalies.push(createAnomalie(
          bon.id,
          'montant_incoherent',
          pourcentageEcart > 100 ? 'elevee' : 'moyenne',
          Math.min(90, 40 + pourcentageEcart),
          `Montant (${bon.montant}€) très différent du coût attendu (${coutAttendu.toFixed(2)}€). Écart: ${pourcentageEcart.toFixed(1)}%.`
        ));
      }
    }
  }

  // Fréquence anormale (check for all phases)
  const chauffeurBons = existingBons
    .filter(b => b.chauffeurId === bon.chauffeurId && b.id !== bon.id)
    .filter(b => {
      const bonDate = new Date(b.date);
      const daysDiff = Math.abs(now.getTime() - bonDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 1; // Bons du même jour
    });

  if (chauffeurBons.length >= 5) {
    anomalies.push(createAnomalie(
      bon.id,
      'frequence_anormale',
      'moyenne',
      55,
      `Fréquence élevée: ${chauffeurBons.length} autres bons pour ce chauffeur dans les dernières 24h.`
    ));
  }

  return anomalies;
};

// New function to detect anomalies for a previous bon when it gets closed
export const detectAnomaliesForPreviousBon = (
  previousBon: Bon,
  allBons: Bon[],
  chauffeurs: Chauffeur[],
  vehicules: Vehicule[]
): Anomalie[] => {
  // Only run full anomaly detection if the previous bon is now CLOSED
  const previousBonPhase = getBonPhase(previousBon);
  if (previousBonPhase === 'CLOSED') {
    return detectAnomalies(previousBon, allBons, chauffeurs, vehicules);
  }
  return [];
};

const createAnomalie = (
  bonId: string,
  type: AnomalieType,
  gravite: AnomalieGravite,
  scoreRisque: number,
  details: string
): Anomalie => ({
  id: generateId(),
  bonId,
  type,
  gravite,
  scoreRisque,
  details,
  statut: 'a_verifier',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const getAnomalieTypeLabel = (type: AnomalieType): string => {
  const labels: Record<AnomalieType, string> = {
    km_invalide: 'Kilométrage invalide',
    recul_kilometrique: 'Recul kilométrique', 
    distance_incoherente: 'Distance incohérente',
    montant_incoherent: 'Montant incohérent',
    bon_incomplet: 'Bon incomplet',
    doublon_numero: 'Doublon numéro',
    frequence_anormale: 'Fréquence anormale'
  };
  return labels[type] || type;
};

export const getAnomalieGraviteColor = (gravite: AnomalieGravite): string => {
  const colors: Record<AnomalieGravite, string> = {
    faible: 'bg-anomaly-low text-foreground',
    moyenne: 'bg-anomaly-medium text-foreground', 
    elevee: 'bg-anomaly-high text-white',
    critique: 'bg-anomaly-critical text-white'
  };
  return colors[gravite] || 'bg-muted text-foreground';
};