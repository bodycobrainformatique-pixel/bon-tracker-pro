// Optimized Supabase data hook with real-time sync and performance improvements
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bon, 
  Chauffeur, 
  Vehicule, 
  Anomalie, 
  BonFilters, 
  Statistics,
  BonType
} from '@/types';
import { detectAnomalies, detectAnomaliesForPreviousBon, evaluateClosedBonWithUpsert } from '@/lib/anomaliesDetection';
import { runAnomalyDetectionTests } from '@/lib/testAnomaliesDetection';

// Database interface mappings
interface DbChauffeur {
  id: string;
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  email?: string;
  adresse: string;
  statut: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DbVehicule {
  id: string;
  immatriculation: string;
  marque?: string;
  modele?: string;
  annee?: number;
  couleur?: string;
  type_carburant: string;
  capacite_reservoir?: number;
  statut: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DbBon {
  id: string;
  numero: string;
  date: string;
  type: string;
  montant: number;
  chauffeur_id: string;
  vehicule_id: string;
  km_initial?: number;
  km_final?: number;
  distance?: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DbAnomalie {
  id: string;
  type: string;
  description: string;
  severite: string;
  statut: string;
  bon_id?: string;
  chauffeur_id?: string;
  vehicule_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Mapping functions
const mapDbChauffeurToChauffeur = (db: DbChauffeur): Chauffeur => ({
  id: db.id,
  nom: db.nom,
  prenom: db.prenom,
  matricule: db.cin,
  telephone: db.telephone,
  email: db.email,
  adresse: db.adresse,
  statut: db.statut as 'actif' | 'inactif',
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDbVehiculeToVehicule = (db: DbVehicule): Vehicule => ({
  id: db.id,
  immatriculation: db.immatriculation,
  marque: db.marque || '',
  modele: db.modele || '',
  annee: db.annee,
  couleur: db.couleur,
  typeCarburant: db.type_carburant as 'gasoil' | 'essence' | 'gasoil50',
  capaciteReservoir: db.capacite_reservoir,
  kilometrage: 0,
  dateAchat: undefined,
  prixAchat: undefined,
  numeroSerie: db.notes || '',
  statut: db.statut as 'en_service' | 'hors_service',
  consommationReference: undefined,
  coutKmReference: undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDbBonToBon = (db: DbBon): Bon => ({
  id: db.id,
  numero: db.numero,
  date: db.date,
  type: db.type as BonType,
  montant: db.montant,
  chauffeurId: db.chauffeur_id,
  vehiculeId: db.vehicule_id,
  kmInitial: db.km_initial,
  kmFinal: db.km_final,
  distance: db.distance,
  notes: db.notes,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

// Helper alias for mapping functions
const mapBonFromDB = mapDbBonToBon;

const mapDbAnomalieToAnomalie = (db: DbAnomalie): Anomalie => ({
  id: db.id,
  bonId: db.bon_id || '',
  type: db.type as any,
  gravite: db.severite as any,
  scoreRisque: 50, // Default value
  details: db.description,
  statut: db.statut as any,
  commentaires: db.notes,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

export const useOptimizedSupabaseData = () => {
  // State management
  const [bons, setBons] = useState<Bon[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadInitialData = async () => {
    try {
      console.log('🔄 Loading initial data...');
      setLoading(true);

      // Parallel data loading for better performance
      const [chauffeursResult, vehiculesResult, bonsResult, anomaliesResult] = await Promise.all([
        supabase.from('chauffeurs').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicules').select('*').order('created_at', { ascending: false }),
        supabase.from('bons').select('*').order('date', { ascending: false }),
        supabase.from('anomalies').select('*').order('created_at', { ascending: false })
      ]);

      // Process results with detailed logging
      if (chauffeursResult.data) {
        const mappedChauffeurs = chauffeursResult.data.map(mapDbChauffeurToChauffeur);
        console.log('👥 Loaded chauffeurs:', mappedChauffeurs.length);
        setChauffeurs(mappedChauffeurs);
      }

      if (vehiculesResult.data) {
        const mappedVehicules = vehiculesResult.data.map(mapDbVehiculeToVehicule);
        console.log('🚗 Loaded vehicules:', mappedVehicules.length);
        setVehicules(mappedVehicules);
      }

      if (bonsResult.data) {
        const mappedBons = bonsResult.data.map(mapDbBonToBon);
        console.log('📋 Loaded bons:', mappedBons.length);
        setBons(mappedBons);
      }

      if (anomaliesResult.data) {
        const mappedAnomalies = anomaliesResult.data.map(mapDbAnomalieToAnomalie);
        console.log('⚠️ Loaded anomalies:', mappedAnomalies.length);
        setAnomalies(mappedAnomalies);
      }

      console.log('✅ Initial data loading complete');

      // Run tests in development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        setTimeout(() => runAnomalyDetectionTests(), 2000);
      }

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions with better performance
  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Setup single channel for all real-time updates with debug logging
    const channel = supabase
      .channel('app-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons' }, (payload) => {
        console.log('🔄 Bon change detected:', payload.eventType);
        loadInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chauffeurs' }, (payload) => {
        console.log('🔄 Chauffeur change detected:', payload.eventType);
        loadInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicules' }, (payload) => {
        console.log('🔄 Vehicule change detected:', payload.eventType);
        loadInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anomalies' }, (payload) => {
        console.log('🔄 Anomalie change detected:', payload.eventType);
        loadInitialData();
      })
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    // Cleanup
    return () => {
      console.log('🛑 Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // CRUD Operations with optimistic updates and real-time sync

  // Chauffeur operations
  const createChauffeur = async (chauffeurData: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .insert({
          nom: chauffeurData.nom,
          prenom: chauffeurData.prenom,
          cin: chauffeurData.matricule,
          telephone: chauffeurData.telephone,
          email: chauffeurData.email || null,
          adresse: chauffeurData.adresse || '',
          statut: chauffeurData.statut,
          notes: '',
          date_embauche: new Date().toISOString().split('T')[0] // Required field
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbChauffeurToChauffeur(data);
    } catch (error) {
      console.error('Erreur création chauffeur:', error);
      throw error;
    }
  };

  const updateChauffeur = async (id: string, chauffeurData: Partial<Chauffeur>) => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .update({
          nom: chauffeurData.nom,
          prenom: chauffeurData.prenom,
          cin: chauffeurData.matricule,
          telephone: chauffeurData.telephone,
          email: chauffeurData.email || null,
          adresse: chauffeurData.adresse || '',
          statut: chauffeurData.statut
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbChauffeurToChauffeur(data);
    } catch (error) {
      console.error('Erreur mise à jour chauffeur:', error);
      throw error;
    }
  };

  const deleteChauffeur = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chauffeurs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression chauffeur:', error);
      throw error;
    }
  };

  // Vehicule operations
  const createVehicule = async (vehiculeData: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .insert({
          immatriculation: vehiculeData.immatriculation,
          marque: vehiculeData.marque || '',
          modele: vehiculeData.modele || '',
          annee: vehiculeData.annee || null,
          couleur: vehiculeData.couleur || '',
          type_carburant: vehiculeData.typeCarburant || 'gasoil50',
          capacite_reservoir: vehiculeData.capaciteReservoir || null,
          statut: vehiculeData.statut || 'en_service',
          notes: vehiculeData.numeroSerie || ''
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbVehiculeToVehicule(data);
    } catch (error) {
      console.error('Erreur création véhicule:', error);
      throw error;
    }
  };

  const updateVehicule = async (id: string, vehiculeData: Partial<Vehicule>) => {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .update({
          immatriculation: vehiculeData.immatriculation,
          marque: vehiculeData.marque || '',
          modele: vehiculeData.modele || '',
          annee: vehiculeData.annee || null,
          couleur: vehiculeData.couleur || '',
          type_carburant: vehiculeData.typeCarburant,
          capacite_reservoir: vehiculeData.capaciteReservoir || null,
          statut: vehiculeData.statut,
          notes: vehiculeData.numeroSerie || ''
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbVehiculeToVehicule(data);
    } catch (error) {
      console.error('Erreur mise à jour véhicule:', error);
      throw error;
    }
  };

  const deleteVehicule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression véhicule:', error);
      throw error;
    }
  };

  // Bon operations with automatic fuel type assignment and optimistic updates
  const createBon = async (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Get vehicle fuel type to ensure consistency
      const vehicule = vehicules.find(v => v.id === bonData.vehiculeId);
      const finalBonData = {
        ...bonData,
        type: vehicule?.typeCarburant || bonData.type // Auto-assign from vehicle
      };

      console.log('💾 Creating bon with data:', finalBonData);

      const { data, error } = await supabase
        .from('bons')
        .insert({
          numero: finalBonData.numero,
          date: finalBonData.date,
          type: finalBonData.type,
          montant: finalBonData.montant,
          chauffeur_id: finalBonData.chauffeurId,
          vehicule_id: finalBonData.vehiculeId,
          km_initial: finalBonData.kmInitial || null,
          notes: finalBonData.notes || '',
          status: 'en_cours'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating bon:', error);
        throw error;
      }
      
      console.log('✅ Bon created successfully:', data);
      
      const newBon = mapDbBonToBon(data);
      
      // Optimistic update - add to local state immediately
      setBons(prev => [newBon, ...prev]);
      
      // Detect anomalies for the new bon (only duplicates for ISSUED bons)
      console.log('🔍 Detecting anomalies for new bon:', newBon);
      const detectedAnomalies = detectAnomalies(newBon, bons, chauffeurs, vehicules);
      console.log('📊 Detected anomalies:', detectedAnomalies);
      
      for (const anomalie of detectedAnomalies) {
        await supabase.from('anomalies').insert({
          type: anomalie.type,
          description: anomalie.details,
          severite: anomalie.gravite,
          statut: anomalie.statut,
          bon_id: anomalie.bonId,
          notes: anomalie.details
        });
      }

      // If this bon has km_initial, check previous bon for anomalies
      if (newBon.kmInitial !== null && newBon.kmInitial !== undefined) {
        console.log('⏳ New bon has km_initial, checking previous bon...');
        const previousBon = bons
          .filter(b => b.vehiculeId === newBon.vehiculeId && b.id !== newBon.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (previousBon) {
          // Wait for database trigger to complete
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Re-fetch the previous bon to get updated km_final from database trigger
          const { data: previousBonData } = await supabase
            .from('bons')
            .select('*')
            .eq('id', previousBon.id)
            .single();
          
          if (previousBonData) {
            const updatedPreviousBon = mapDbBonToBon(previousBonData);
            console.log('🔍 Checking anomalies for previous bon after trigger:', updatedPreviousBon);
            
            const previousBonAnomalies = detectAnomalies(updatedPreviousBon, [...bons, newBon], chauffeurs, vehicules);
            
            for (const anomalie of previousBonAnomalies) {
              await supabase.from('anomalies').insert({
                type: anomalie.type,
                description: anomalie.details,
                severite: anomalie.gravite,
                statut: anomalie.statut,
                bon_id: anomalie.bonId,
                notes: anomalie.details
              });
            }
          }
        }
      }

      return newBon;
    } catch (error) {
      console.error('❌ Erreur création bon:', error);
      throw error;
    }
  };

  const updateBon = async (id: string, updates: Partial<Bon>) => {
    // Get the original bon before update
    const originalBon = bons.find(b => b.id === id);
    
    // Transform updates to match database column names
    const dbUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'chauffeurId':
          dbUpdates.chauffeur_id = value;
          break;
        case 'vehiculeId':
          dbUpdates.vehicule_id = value;
          break;
        case 'kmInitial':
          dbUpdates.km_initial = value;
          break;
        case 'kmFinal':
          dbUpdates.km_final = value;
          break;
        default:
          dbUpdates[key] = value;
      }
    });

    const { data, error } = await supabase
      .from('bons')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If km_initial was added to this bon, it might have closed a previous bon via trigger
    if (updates.kmInitial !== undefined && originalBon && !originalBon.kmInitial) {
      console.log('🔄 km_initial added to bon, invalidating queries and checking for closed previous bon...');
      
      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload all data to get trigger updates
      await loadInitialData();
      
      // Get updated bon data to find the previous bon that may have been closed
      const { data: updatedBons } = await supabase
        .from('bons')
        .select('*')
        .eq('vehicule_id', originalBon.vehiculeId)
        .order('date', { ascending: false })
        .order('numero', { ascending: false });
      
      if (updatedBons && updatedBons.length > 0) {
        // Find the updated current bon
        const updatedCurrentBon = updatedBons.find(b => b.id === id);
        
        if (updatedCurrentBon) {
          // Find the previous bon (most recent before current)
          const previousBon = updatedBons.find(b => 
            b.id !== id && 
            (new Date(b.date) < new Date(updatedCurrentBon.date) || 
             (b.date === updatedCurrentBon.date && b.numero < updatedCurrentBon.numero))
          );
          
          if (previousBon && previousBon.km_final && previousBon.km_initial) {
            console.log('🎯 Found previous bon that was closed by trigger, running anomaly detection...');
            
            // Convert to frontend format and run anomaly detection
            const mappedPreviousBon: Bon = {
              id: previousBon.id,
              numero: previousBon.numero,
              date: previousBon.date,
              type: previousBon.type as BonType,
              montant: Number(previousBon.montant),
              chauffeurId: previousBon.chauffeur_id,
              vehiculeId: previousBon.vehicule_id,
              kmInitial: previousBon.km_initial ? Number(previousBon.km_initial) : undefined,
              kmFinal: previousBon.km_final ? Number(previousBon.km_final) : undefined,
              distance: previousBon.distance ? Number(previousBon.distance) : undefined,
              notes: previousBon.notes,
              createdAt: previousBon.created_at,
              updatedAt: previousBon.updated_at
            };
            
            // Map all bons for context
            const allMappedBons: Bon[] = updatedBons.map(mapBonFromDB);
            
            // Run traditional anomaly detection for the previous bon
            await detectAnomaliesForPreviousBon(mappedPreviousBon, allMappedBons, chauffeurs, vehicules);
            
            // Run consumption-based anomaly detection for the previous bon
            await evaluateClosedBonWithUpsert(mappedPreviousBon);
            
            // Final refresh to show any new anomalies
            await loadInitialData();
          }
        }
      }
    }

    // If km_final was updated (bon becomes CLOSED), evaluate consumption anomalies
    if (updates.kmFinal !== undefined && originalBon && originalBon.kmInitial) {
      console.log('🎯 km_final updated, evaluating consumption anomalies...');
      
      const updatedBon: Bon = {
        ...originalBon,
        ...updates,
        kmFinal: updates.kmFinal,
        distance: updates.kmFinal && originalBon.kmInitial 
          ? Math.max(0, updates.kmFinal - originalBon.kmInitial) 
          : originalBon.distance
      };
      
      // Run consumption-based anomaly detection
      await evaluateClosedBonWithUpsert(updatedBon);
      
      // Refresh anomalies
      await loadInitialData();
    }

    return mapBonFromDB(data);
  };

  const deleteBon = async (id: string) => {
    try {
      console.log('🗑️ Deleting bon:', id);
      
      // Optimistic update - remove from local state immediately
      setBons(prev => prev.filter(b => b.id !== id));
      
      const { error } = await supabase
        .from('bons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting bon:', error);
        // Revert optimistic update
        loadInitialData();
        throw error;
      }
      
      console.log('✅ Bon deleted successfully');
    } catch (error) {
      console.error('❌ Erreur suppression bon:', error);
      throw error;
    }
  };

  // Anomalie operations
  const updateAnomalie = async (id: string, anomalieData: Partial<Anomalie>) => {
    try {
      const { data, error } = await supabase
        .from('anomalies')
        .update({
          statut: anomalieData.statut,
          notes: anomalieData.commentaires || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbAnomalieToAnomalie(data);
    } catch (error) {
      console.error('Erreur mise à jour anomalie:', error);
      throw error;
    }
  };

  // Utility functions
  const getFilteredBons = (filters: BonFilters): Bon[] => {
    return bons.filter(bon => {
      if (filters.dateFrom && bon.date < filters.dateFrom) return false;
      if (filters.dateTo && bon.date > filters.dateTo) return false;
      if (filters.type && bon.type !== filters.type) return false;
      if (filters.chauffeurId && bon.chauffeurId !== filters.chauffeurId) return false;
      if (filters.vehiculeId && bon.vehiculeId !== filters.vehiculeId) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const chauffeur = chauffeurs.find(c => c.id === bon.chauffeurId);
        const vehicule = vehicules.find(v => v.id === bon.vehiculeId);
        const searchText = [
          bon.numero,
          chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : '',
          vehicule ? vehicule.immatriculation : '',
          bon.notes || ''
        ].join(' ').toLowerCase();
        
        if (!searchText.includes(searchLower)) return false;
      }
      return true;
    });
  };

  const getStatistics = (filteredBons: Bon[]): Statistics => {
    return filteredBons.reduce((stats, bon) => ({
      totalMontant: stats.totalMontant + bon.montant,
      totalDistance: stats.totalDistance + (bon.distance || 0),
      totalBons: stats.totalBons + 1,
      montantGasoil: stats.montantGasoil + (bon.type === 'gasoil' ? bon.montant : 0),
      montantEssence: stats.montantEssence + (bon.type === 'essence' ? bon.montant : 0),
      montantGasoil50: stats.montantGasoil50 + (bon.type === 'gasoil50' ? bon.montant : 0),
      anomaliesCount: stats.anomaliesCount
    }), {
      totalMontant: 0,
      totalDistance: 0,
      totalBons: 0,
      montantGasoil: 0,
      montantEssence: 0,
      montantGasoil50: 0,
      anomaliesCount: anomalies.filter(a => a.statut === 'a_verifier').length
    });
  };

  return {
    // Data
    bons,
    chauffeurs,
    vehicules,
    anomalies,
    loading,

    // CRUD operations
    createChauffeur,
    updateChauffeur,
    deleteChauffeur,
    createVehicule,
    updateVehicule,
    deleteVehicule,
    createBon,
    updateBon,
    deleteBon,
    updateAnomalie,

    // Utility functions
    getFilteredBons,
    getStatistics
  };
};