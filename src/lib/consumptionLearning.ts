// Learning-based anomaly detection for fuel consumption using robust statistics
import { Bon, BonType, Anomalie, AnomalieType, AnomalieGravite } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Configuration constants
const WINDOW_SIZE = 20;
const MIN_SAMPLES = 5;
const MIN_DISTANCE_KM = 10;
const THRESHOLD_MEDIUM = 3.0;
const THRESHOLD_HIGH = 4.5;
const ROBUST_EPSILON = 1e-6;

// Statistical helper functions
export const median = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
};

export const mad = (numbers: number[], m: number): number => {
  if (numbers.length === 0) return 0;
  const deviations = numbers.map(x => Math.abs(x - m));
  return median(deviations);
};

export const robustZ = (x: number, m: number, s: number, eps: number = ROBUST_EPSILON): number => {
  return 0.6745 * (x - m) / Math.max(s, eps);
};

// Get fuel price for a given type and date
export const getPriceOnDate = async (type: BonType, date: string): Promise<number | null> => {
  try {
    // For now, use current price since we don't have historical pricing
    // In future, this could query historical carburant_parameters with date filtering
    const { data, error } = await supabase
      .from('carburant_parameters')
      .select('prix')
      .eq('type', type)
      .single();

    if (error) {
      console.warn(`No price found for fuel type ${type}:`, error);
      return null;
    }

    return data?.prix ?? null;
  } catch (error) {
    console.error('Error getting fuel price:', error);
    return null;
  }
};

// Compute consumption in L/100km for a bon
export const computeConsoL100 = async (bon: Bon, priceByType?: Partial<Record<BonType, number>>): Promise<number | null> => {
  // Must be a CLOSED bon with valid distance
  if (!bon.kmInitial || !bon.kmFinal || !bon.distance || bon.distance < MIN_DISTANCE_KM) {
    return null;
  }

  if (bon.montant <= 0) {
    return null;
  }

  // Calculate liters
  let liters: number;
  
  // For now, since there's no liters field in the schema, calculate from montant/price
  const price = priceByType?.[bon.type] ?? await getPriceOnDate(bon.type, bon.date);
  if (!price || price <= 0) {
    return null;
  }

  liters = bon.montant / price;
  
  if (liters <= 0) {
    return null;
  }

  // Calculate consumption in L/100km
  const consoL100 = (100 * liters) / bon.distance;
  
  return consoL100 > 0 ? consoL100 : null;
};

// Build rolling window of consumption values for a vehicle
export const buildVehicleWindow = async (
  vehiculeId: string,
  excludeBonId?: string,
  windowSize: number = WINDOW_SIZE,
  minDistanceKm: number = MIN_DISTANCE_KM
): Promise<number[]> => {
  try {
    // Get CLOSED bons for this vehicle (ordered by date/numero, most recent first)
    const { data: bons, error } = await supabase
      .from('bons')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .not('km_initial', 'is', null)
      .not('km_final', 'is', null)
      .not('distance', 'is', null)
      .gte('distance', minDistanceKm)
      .gt('montant', 0)
      .order('date', { ascending: false })
      .order('numero', { ascending: false })
      .limit(windowSize);

    if (error) {
      console.error('Error fetching vehicle bons:', error);
      return [];
    }

    if (!bons) return [];

    // Filter out the excluded bon if specified
    const filteredBons = excludeBonId 
      ? bons.filter(b => b.id !== excludeBonId)
      : bons;

    // Get current fuel prices
    const { data: fuelParams, error: priceError } = await supabase
      .from('carburant_parameters')
      .select('type, prix');

    if (priceError) {
      console.error('Error fetching fuel prices:', priceError);
      return [];
    }

    const priceByType: Partial<Record<BonType, number>> = {};
    fuelParams?.forEach(param => {
      priceByType[param.type as BonType] = param.prix;
    });

    // Compute consumption for each bon
    const consumptions: number[] = [];
    
    for (const bon of filteredBons) {
      const mappedBon: Bon = {
        id: bon.id,
        numero: bon.numero,
        date: bon.date,
        type: bon.type as BonType,
        montant: Number(bon.montant),
        chauffeurId: bon.chauffeur_id,
        vehiculeId: bon.vehicule_id,
        kmInitial: bon.km_initial ? Number(bon.km_initial) : undefined,
        kmFinal: bon.km_final ? Number(bon.km_final) : undefined,
        distance: bon.distance ? Number(bon.distance) : undefined,
        notes: bon.notes,
        createdAt: bon.created_at,
        updatedAt: bon.updated_at
      };

      const conso = await computeConsoL100(mappedBon, priceByType);
      if (conso !== null) {
        consumptions.push(conso);
      }
    }

    return consumptions;
  } catch (error) {
    console.error('Error building vehicle window:', error);
    return [];
  }
};

// Interface for new anomaly detection result
export interface NewAnomaly {
  bonId: string;
  type: AnomalieType;
  gravite: AnomalieGravite;
  scoreRisque: number;
  details: string;
}

// Evaluate a CLOSED bon for consumption anomalies
export const evaluateClosedBon = async (bon: Bon): Promise<NewAnomaly[]> => {
  const anomalies: NewAnomaly[] = [];

  // Validate basic requirements for consumption analysis
  if (!bon.kmInitial || !bon.kmFinal || !bon.distance || bon.distance < MIN_DISTANCE_KM) {
    return anomalies;
  }

  // Check for invalid distance
  if (bon.distance <= 0) {
    anomalies.push({
      bonId: bon.id,
      type: 'distance_invalide',
      gravite: 'elevee',
      scoreRisque: 85,
      details: 'distance <= 0'
    });
    return anomalies; // Don't continue with consumption analysis
  }

  // Check for invalid km (km_final < km_initial)
  if (bon.kmFinal < bon.kmInitial) {
    anomalies.push({
      bonId: bon.id,
      type: 'km_invalide',
      gravite: 'elevee',
      scoreRisque: 85,
      details: `km_final (${bon.kmFinal}) < km_initial (${bon.kmInitial})`
    });
    return anomalies; // Don't continue with consumption analysis
  }

  // Get consumption for this bon
  const currentConso = await computeConsoL100(bon);
  if (currentConso === null) {
    return anomalies; // Can't analyze consumption
  }

  // Build baseline window for this vehicle
  const window = await buildVehicleWindow(bon.vehiculeId, bon.id);
  
  // Need at least MIN_SAMPLES for robust baseline
  if (window.length < MIN_SAMPLES) {
    return anomalies; // Not enough history, don't flag
  }

  // Compute robust statistics
  const m = median(window);
  const s = mad(window, m);
  const z = robustZ(currentConso, m, s);

  // Flag based on thresholds
  if (Math.abs(z) >= THRESHOLD_HIGH) {
    anomalies.push({
      bonId: bon.id,
      type: 'conso_outlier_high',
      gravite: 'elevee',
      scoreRisque: 90,
      details: `Conso ${currentConso.toFixed(1)} L/100km vs médiane ${m.toFixed(1)} (z=${z.toFixed(2)}, n=${window.length})`
    });
  } else if (Math.abs(z) >= THRESHOLD_MEDIUM) {
    anomalies.push({
      bonId: bon.id,
      type: 'conso_outlier_med',
      gravite: 'moyenne',
      scoreRisque: 70,
      details: `Conso ${currentConso.toFixed(1)} L/100km vs médiane ${m.toFixed(1)} (z=${z.toFixed(2)}, n=${window.length})`
    });
  }

  return anomalies;
};

// Upsert anomaly to avoid duplicates
export const upsertAnomaly = async (newAnomaly: NewAnomaly): Promise<void> => {
  try {
    // Check if anomaly already exists for this bon/type
    const { data: existing, error: selectError } = await supabase
      .from('anomalies')
      .select('id')
      .eq('bon_id', newAnomaly.bonId)
      .eq('type', newAnomaly.type)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing anomaly:', selectError);
      return;
    }

    const anomalieData = {
      bon_id: newAnomaly.bonId,
      type: newAnomaly.type,
      severite: newAnomaly.gravite,
      description: newAnomaly.details,
      notes: newAnomaly.details,
      statut: 'a_verifier' as const,
      updated_at: new Date().toISOString()
    };

    if (existing?.id) {
      // Update existing anomaly
      const { error: updateError } = await supabase
        .from('anomalies')
        .update(anomalieData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating anomaly:', updateError);
      }
    } else {
      // Insert new anomaly
      const { error: insertError } = await supabase
        .from('anomalies')
        .insert({
          ...anomalieData,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting anomaly:', insertError);
      }
    }
  } catch (error) {
    console.error('Error upserting anomaly:', error);
  }
};

// Clean up previous consumption anomalies for a bon before evaluating new ones
export const cleanupConsumptionAnomalies = async (bonId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('anomalies')
      .delete()
      .eq('bon_id', bonId)
      .in('type', ['conso_outlier_high', 'conso_outlier_med', 'distance_invalide', 'km_invalide']);

    if (error) {
      console.error('Error cleaning up consumption anomalies:', error);
    }
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
};