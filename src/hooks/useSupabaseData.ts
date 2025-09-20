// Hook pour la gestion des données avec Supabase

import { useState, useEffect } from 'react';
import { Bon, Chauffeur, Vehicule, Anomalie, BonFilters, Statistics } from '@/types';
import { StorageService, KEYS } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { detectAnomalies } from '@/lib/anomaliesDetection';
import { bons, chauffeurs, vehicules, anomalies } from '@/lib/seedData';

// Types pour les données de la base Supabase
interface DbChauffeur {
  id: string;
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  email: string | null;
  adresse: string;
  date_naissance: string;
  date_embauche: string;
  salaire_base: number;
  statut: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbVehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  type_carburant: string;
  capacite_reservoir: number;
  date_mise_en_service: string;
  cout_acquisition: number;
  cout_maintenance_annuel: number | null;
  statut: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbBon {
  id: string;
  numero: string;
  date: string;
  type: string;
  montant: number;
  km_initial: number | null;
  km_final: number | null;
  distance: number | null;
  chauffeur_id: string;
  vehicule_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbAnomalie {
  id: string;
  type: string;
  description: string;
  severite: string;
  statut: string;
  bon_id: string | null;
  chauffeur_id: string | null;
  vehicule_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Fonctions de mapping
const mapDbChauffeurToChauffeur = (dbChauffeur: DbChauffeur): Chauffeur => ({
  id: dbChauffeur.id,
  nom: dbChauffeur.nom,
  prenom: dbChauffeur.prenom,
  matricule: dbChauffeur.cin, // Using CIN as matricule for consistency
  telephone: dbChauffeur.telephone,
  email: dbChauffeur.email || '',
  adresse: dbChauffeur.adresse || '',
  statut: dbChauffeur.statut as 'actif' | 'inactif',
  createdAt: dbChauffeur.created_at,
  updatedAt: dbChauffeur.updated_at
});

const mapDbVehiculeToVehicule = (dbVehicule: DbVehicule): Vehicule => ({
  id: dbVehicule.id,
  immatriculation: dbVehicule.immatriculation,
  marque: dbVehicule.marque,
  modele: dbVehicule.modele,
  annee: dbVehicule.annee,
  couleur: dbVehicule.couleur,
  typeCarburant: dbVehicule.type_carburant as 'gasoil' | 'essence' | 'gasoil50',
  capaciteReservoir: Number(dbVehicule.capacite_reservoir),
  kilometrage: 0, // Auto-computed from bons
  dateAchat: dbVehicule.date_mise_en_service,
  prixAchat: Number(dbVehicule.cout_acquisition),
  numeroSerie: dbVehicule.notes || '',
  consommationReference: undefined, // Not directly mapped
  coutKmReference: undefined, // Not directly mapped
  statut: (dbVehicule.statut === 'en_service' ? 'actif' : 'inactif') as 'actif' | 'inactif',
  createdAt: dbVehicule.created_at,
  updatedAt: dbVehicule.updated_at
});

const mapDbBonToBon = (dbBon: DbBon): Bon => ({
  id: dbBon.id,
  numero: dbBon.numero,
  date: dbBon.date,
  type: dbBon.type as 'gasoil' | 'essence' | 'gasoil50',
  montant: Number(dbBon.montant),
  kmInitial: dbBon.km_initial ? Number(dbBon.km_initial) : undefined,
  kmFinal: dbBon.km_final ? Number(dbBon.km_final) : undefined,
  distance: dbBon.distance ? Number(dbBon.distance) : undefined,
  chauffeurId: dbBon.chauffeur_id,
  vehiculeId: dbBon.vehicule_id,
  notes: dbBon.notes || undefined,
  createdAt: dbBon.created_at,
  updatedAt: dbBon.updated_at
});

const mapDbAnomalieToAnomalie = (dbAnomalie: DbAnomalie): Anomalie => ({
  id: dbAnomalie.id,
  bonId: dbAnomalie.bon_id || '',
  type: (dbAnomalie.type === 'consommation_elevee' ? 'montant_incoherent' : 
        dbAnomalie.type === 'distance_incoherente' ? 'distance_incoherente' : 
        'km_invalide') as 'km_invalide' | 'recul_kilometrique' | 'distance_incoherente' | 'montant_incoherent' | 'bon_incomplet' | 'doublon_numero' | 'frequence_anormale',
  gravite: dbAnomalie.severite as 'faible' | 'moyenne' | 'elevee' | 'critique',
  scoreRisque: dbAnomalie.severite === 'elevee' ? 80 : dbAnomalie.severite === 'moyenne' ? 50 : 20,
  details: dbAnomalie.description || '',
  statut: (dbAnomalie.statut === 'resolue' ? 'justifiee' : 
           dbAnomalie.statut === 'a_verifier' ? 'a_verifier' : 
           'en_cours') as 'a_verifier' | 'en_cours' | 'justifiee' | 'fraude',
  commentaires: dbAnomalie.notes || undefined,
  createdAt: dbAnomalie.created_at,
  updatedAt: dbAnomalie.updated_at
});

export const useSupabaseData = () => {
  const [bons, setBons] = useState<Bon[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialisation des données depuis Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les chauffeurs
        const { data: chauffeursData, error: chauffeursError } = await supabase
          .from('chauffeurs')
          .select('*')
          .order('created_at', { ascending: false });

        if (chauffeursError) {
          console.error('Erreur lors du chargement des chauffeurs:', chauffeursError);
          setChauffeurs(StorageService.get<Chauffeur[]>(KEYS.CHAUFFEURS, chauffeurs));
        } else {
          const mappedChauffeurs = (chauffeursData as DbChauffeur[]).map(mapDbChauffeurToChauffeur);
          setChauffeurs(mappedChauffeurs);
        }

        // Charger les véhicules
        const { data: vehiculesData, error: vehiculesError } = await supabase
          .from('vehicules')
          .select('*')
          .order('created_at', { ascending: false });

        if (vehiculesError) {
          console.error('Erreur lors du chargement des véhicules:', vehiculesError);
          setVehicules(StorageService.get<Vehicule[]>(KEYS.VEHICULES, vehicules));
        } else {
          const mappedVehicules = (vehiculesData as DbVehicule[]).map(mapDbVehiculeToVehicule);
          setVehicules(mappedVehicules);
        }

        // Charger les bons
        const { data: bonsData, error: bonsError } = await supabase
          .from('bons')
          .select('*')
          .order('created_at', { ascending: false });

        if (bonsError) {
          console.error('Erreur lors du chargement des bons:', bonsError);
        setBons(StorageService.get<Bon[]>(KEYS.BONS, bons));
        } else {
          const mappedBons = (bonsData as DbBon[]).map(mapDbBonToBon);
          setBons(mappedBons);
        }

        // Charger les anomalies
        const { data: anomaliesData, error: anomaliesError } = await supabase
          .from('anomalies')
          .select('*')
          .order('created_at', { ascending: false });

        if (anomaliesError) {
          console.error('Erreur lors du chargement des anomalies:', anomaliesError);
        setAnomalies(StorageService.get<Anomalie[]>(KEYS.ANOMALIES, anomalies));
        } else {
          const mappedAnomalies = (anomaliesData as DbAnomalie[]).map(mapDbAnomalieToAnomalie);
          setAnomalies(mappedAnomalies);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Fallback sur localStorage
        setBons(StorageService.get<Bon[]>(KEYS.BONS, bons));
        setChauffeurs(StorageService.get<Chauffeur[]>(KEYS.CHAUFFEURS, chauffeurs));
        setVehicules(StorageService.get<Vehicule[]>(KEYS.VEHICULES, vehicules));
        setAnomalies(StorageService.get<Anomalie[]>(KEYS.ANOMALIES, anomalies));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to reload bons data
  const reloadBonsData = async () => {
    try {
      const { data: bonsData, error: bonsError } = await supabase
        .from('bons')
        .select('*')
        .order('created_at', { ascending: false });

      if (bonsError) {
        console.error('Erreur lors du rechargement des bons:', bonsError);
      } else {
        const mappedBons = (bonsData as DbBon[]).map(mapDbBonToBon);
        setBons(mappedBons);
      }
    } catch (error) {
      console.error('Erreur lors du rechargement des bons:', error);
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons' },
        () => {
          console.log('Bons table changed, reloading...');
          loadBons();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicules' },
        () => {
          console.log('Vehicules table changed, reloading...');
          loadVehicules();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chauffeurs' },
        () => {
          console.log('Chauffeurs table changed, reloading...');
          loadChauffeurs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'carburant_parameters' },
        () => {
          console.log('Carburant parameters changed, reloading...');
          // Could trigger a refresh of fuel parameters if needed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBons = async () => {
    try {
      const { data: bonsData, error: bonsError } = await supabase
        .from('bons')
        .select('*')
        .order('created_at', { ascending: false });

      if (bonsError) {
        console.error('Erreur lors du chargement des bons:', bonsError);
      } else {
        const mappedBons = (bonsData as DbBon[]).map(mapDbBonToBon);
        setBons(mappedBons);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bons:', error);
    }
  };

  const loadVehicules = async () => {
    try {
      const { data: vehiculesData, error: vehiculesError } = await supabase
        .from('vehicules')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehiculesError) {
        console.error('Erreur lors du chargement des véhicules:', vehiculesError);
      } else {
        const mappedVehicules = (vehiculesData as DbVehicule[]).map(mapDbVehiculeToVehicule);
        setVehicules(mappedVehicules);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
    }
  };

  const loadChauffeurs = async () => {
    try {
      const { data: chauffeursData, error: chauffeursError } = await supabase
        .from('chauffeurs')
        .select('*')
        .order('created_at', { ascending: false });

      if (chauffeursError) {
        console.error('Erreur lors du chargement des chauffeurs:', chauffeursError);
      } else {
        const mappedChauffeurs = (chauffeursData as DbChauffeur[]).map(mapDbChauffeurToChauffeur);
        setChauffeurs(mappedChauffeurs);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
    }
  };

  // Fonctions CRUD pour les bons
  const createBon = async (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('bons')
        .insert([{
          numero: bonData.numero,
          date: bonData.date,
          type: bonData.type,
          montant: bonData.montant,
          km_initial: bonData.kmInitial,
          // km_final and distance will be managed by database trigger
          chauffeur_id: bonData.chauffeurId,
          vehicule_id: bonData.vehiculeId,
          notes: bonData.notes
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du bon:', error);
        throw error;
      }

      // Small delay to ensure trigger execution, then refresh all bons data
      await new Promise(resolve => setTimeout(resolve, 100));
      await reloadBonsData();
      
      const newBon = mapDbBonToBon(data as DbBon);
      
      // Détection d'anomalies
      const newAnomalies = detectAnomalies(newBon, bons, chauffeurs, vehicules);
      if (newAnomalies.length > 0) {
        setAnomalies(prev => [...newAnomalies, ...prev]);
      }

      return newBon;
    } catch (error) {
      console.error('Erreur lors de la création du bon:', error);
      throw error;
    }
  };

  const updateBon = async (id: string, updates: Partial<Bon>) => {
    try {
      const { error } = await supabase
        .from('bons')
        .update({
          numero: updates.numero,
          date: updates.date,
          type: updates.type,
          montant: updates.montant,
          km_initial: updates.kmInitial,
          // km_final and distance are managed by database trigger
          chauffeur_id: updates.chauffeurId,
          vehicule_id: updates.vehiculeId,
          notes: updates.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du bon:', error);
        throw error;
      }

      // Small delay to ensure trigger execution, then refresh all bons data
      await new Promise(resolve => setTimeout(resolve, 100));
      await reloadBonsData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bon:', error);
      throw error;
    }
  };

  const deleteBon = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du bon:', error);
        throw error;
      }

      setBons(prev => prev.filter(bon => bon.id !== id));
      setAnomalies(prev => prev.filter(anomalie => anomalie.bonId !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du bon:', error);
      throw error;
    }
  };

  // Fonctions CRUD pour les chauffeurs
  const createChauffeur = async (chauffeurData: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .insert([{
          nom: chauffeurData.nom,
          prenom: chauffeurData.prenom,
          cin: chauffeurData.matricule,
          telephone: chauffeurData.telephone,
          email: chauffeurData.email || null,
          adresse: chauffeurData.adresse || null,
          date_naissance: '1980-01-01', // Default date
          date_embauche: new Date().toISOString().split('T')[0], // Today's date
          salaire_base: 0, // Default salary
          statut: chauffeurData.statut,
          notes: null
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du chauffeur:', error);
        throw error;
      }

      const newChauffeur = mapDbChauffeurToChauffeur(data as DbChauffeur);
      setChauffeurs(prev => [newChauffeur, ...prev]);
      return newChauffeur;
    } catch (error) {
      console.error('Erreur lors de la création du chauffeur:', error);
      throw error;
    }
  };

  const updateChauffeur = async (id: string, updates: Partial<Chauffeur>) => {
    try {
      const { error } = await supabase
        .from('chauffeurs')
        .update({
          nom: updates.nom,
          prenom: updates.prenom,
          cin: updates.matricule,
          telephone: updates.telephone,
          email: updates.email || null,
          adresse: updates.adresse || null,
          statut: updates.statut,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du chauffeur:', error);
        throw error;
      }

      setChauffeurs(prev => prev.map(chauffeur => 
        chauffeur.id === id 
          ? { ...chauffeur, ...updates, updatedAt: new Date().toISOString() }
          : chauffeur
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chauffeur:', error);
      throw error;
    }
  };

  const deleteChauffeur = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chauffeurs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du chauffeur:', error);
        throw error;
      }

      setChauffeurs(prev => prev.filter(chauffeur => chauffeur.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du chauffeur:', error);
      throw error;
    }
  };

  // Fonctions CRUD pour les véhicules
  const createVehicule = async (vehiculeData: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('vehicules')
        .insert([{
          immatriculation: vehiculeData.immatriculation,
          marque: vehiculeData.marque || '',
          modele: vehiculeData.modele || '',
          annee: vehiculeData.annee || null,
          couleur: vehiculeData.couleur || '',
          type_carburant: vehiculeData.typeCarburant || 'gasoil',
          capacite_reservoir: vehiculeData.capaciteReservoir || null,
          date_mise_en_service: vehiculeData.dateAchat ? vehiculeData.dateAchat : null,
          cout_acquisition: vehiculeData.prixAchat || null,
          cout_maintenance_annuel: 0,
          statut: vehiculeData.statut === 'actif' ? 'en_service' : 'hors_service',
          notes: vehiculeData.numeroSerie || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du véhicule:', error);
        throw error;
      }

      const newVehicule = mapDbVehiculeToVehicule(data as DbVehicule);
      setVehicules(prev => [newVehicule, ...prev]);
      return newVehicule;
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error);
      throw error;
    }
  };

  const updateVehicule = async (id: string, updates: Partial<Vehicule>) => {
    try {
      const { error } = await supabase
        .from('vehicules')
        .update({
          immatriculation: updates.immatriculation,
          marque: updates.marque,
          modele: updates.modele,
          annee: updates.annee,
          couleur: updates.couleur,
          type_carburant: updates.typeCarburant,
          capacite_reservoir: updates.capaciteReservoir,
          date_mise_en_service: updates.dateAchat || null,
          cout_acquisition: updates.prixAchat,
          statut: updates.statut === 'actif' ? 'en_service' : 'hors_service',
          notes: updates.numeroSerie || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du véhicule:', error);
        throw error;
      }

      setVehicules(prev => prev.map(vehicule => 
        vehicule.id === id 
          ? { ...vehicule, ...updates, updatedAt: new Date().toISOString() }
          : vehicule
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule:', error);
      throw error;
    }
  };

  const deleteVehicule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du véhicule:', error);
        throw error;
      }

      setVehicules(prev => prev.filter(vehicule => vehicule.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error);
      throw error;
    }
  };

  // Fonctions pour les anomalies
  const updateAnomalie = async (id: string, updates: Partial<Anomalie>) => {
    try {
      const { error } = await supabase
        .from('anomalies')
        .update({
          type: updates.type,
          description: updates.details || '',
          severite: updates.gravite,
          statut: updates.statut,
          notes: updates.details,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'anomalie:', error);
        throw error;
      }

      setAnomalies(prev => prev.map(anomalie => 
        anomalie.id === id 
          ? { ...anomalie, ...updates, updatedAt: new Date().toISOString() }
          : anomalie
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'anomalie:', error);
      throw error;
    }
  };

  // Fonction pour sauvegarder les données actuelles vers Supabase
  const saveCurrentDataToSupabase = async () => {
    try {
      let savedCount = 0;
      let errorCount = 0;

      // Sauvegarder les chauffeurs
      for (const chauffeur of chauffeurs) {
        const { error } = await supabase
          .from('chauffeurs')
          .upsert({
            id: chauffeur.id,
            nom: chauffeur.nom,
            prenom: chauffeur.prenom,
            cin: chauffeur.matricule,
            telephone: chauffeur.telephone,
            email: chauffeur.email || '',
            adresse: chauffeur.adresse || '',
            date_naissance: '1980-01-01', // Default date
            date_embauche: new Date().toISOString().split('T')[0], // Today's date  
            salaire_base: 0, // Default salary
            statut: chauffeur.statut,
            created_at: chauffeur.createdAt,
            updated_at: chauffeur.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la sauvegarde du chauffeur:', chauffeur.id, error);
          errorCount++;
        } else {
          savedCount++;
        }
      }

      // Sauvegarder les véhicules
      for (const vehicule of vehicules) {
        const { error } = await supabase
          .from('vehicules')
          .upsert({
            id: vehicule.id,
            immatriculation: vehicule.immatriculation,
            marque: vehicule.marque,
            modele: vehicule.modele,
            annee: vehicule.annee || new Date().getFullYear(),
            couleur: vehicule.couleur || '',
            type_carburant: vehicule.typeCarburant || 'gasoil',
            capacite_reservoir: vehicule.capaciteReservoir || 0,
            kilometrage: vehicule.kilometrage || 0,
            date_mise_en_service: vehicule.dateAchat || new Date().toISOString().split('T')[0],
            cout_acquisition: vehicule.prixAchat || 0,
            cout_maintenance_annuel: vehicule.consommationReference || 0,
            statut: vehicule.statut === 'actif' ? 'en_service' : 'hors_service',
            created_at: vehicule.createdAt,
            updated_at: vehicule.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la sauvegarde du véhicule:', vehicule.id, error);
          errorCount++;
        } else {
          savedCount++;
        }
      }

      // Sauvegarder les bons
      for (const bon of bons) {
        const { error } = await supabase
          .from('bons')
          .upsert({
            id: bon.id,
            numero: bon.numero,
            date: bon.date,
            type: bon.type,
            montant: bon.montant,
            distance: bon.distance || null,
            chauffeur_id: bon.chauffeurId,
            vehicule_id: bon.vehiculeId,
            notes: bon.notes || null,
            created_at: bon.createdAt,
            updated_at: bon.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la sauvegarde du bon:', bon.id, error);
          errorCount++;
        } else {
          savedCount++;
        }
      }

      // Sauvegarder les anomalies
      for (const anomalie of anomalies) {
        const { error } = await supabase
          .from('anomalies')
          .upsert({
            id: anomalie.id,
            type: anomalie.type,
            description: anomalie.details || '',
            severite: anomalie.gravite,
            statut: anomalie.statut === 'justifiee' ? 'resolue' : anomalie.statut === 'fraude' ? 'ignoree' : 'a_verifier',
            bon_id: anomalie.bonId || null,
            chauffeur_id: null,
            vehicule_id: null,
            notes: anomalie.commentaires || null,
            created_at: anomalie.createdAt,
            updated_at: anomalie.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la sauvegarde de l\'anomalie:', anomalie.id, error);
          errorCount++;
        } else {
          savedCount++;
        }
      }

      console.log(`Sauvegarde terminée: ${savedCount} éléments sauvegardés, ${errorCount} erreurs`);
      
      if (errorCount > 0) {
        throw new Error(`${errorCount} erreurs lors de la sauvegarde`);
      }

      return { savedCount, errorCount };

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  };

  const syncWithLocalStorage = async () => {
    try {
      // Récupérer les données de localStorage
      const localBons = StorageService.get<Bon[]>(KEYS.BONS, []);
      const localChauffeurs = StorageService.get<Chauffeur[]>(KEYS.CHAUFFEURS, []);
      const localVehicules = StorageService.get<Vehicule[]>(KEYS.VEHICULES, []);
      const localAnomalies = StorageService.get<Anomalie[]>(KEYS.ANOMALIES, []);

      // Synchroniser les chauffeurs
      for (const chauffeur of localChauffeurs) {
        const { error } = await supabase
          .from('chauffeurs')
          .upsert({
            id: chauffeur.id,
            nom: chauffeur.nom,
            prenom: chauffeur.prenom,
            cin: chauffeur.matricule,
            telephone: chauffeur.telephone,
            email: chauffeur.email,
            adresse: chauffeur.adresse,
            date_naissance: '1980-01-01', // Default date
            date_embauche: new Date().toISOString().split('T')[0], // Today's date
            salaire_base: 0, // Default salary
            statut: chauffeur.statut,
            created_at: chauffeur.createdAt,
            updated_at: chauffeur.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la synchronisation du chauffeur:', chauffeur.id, error);
        }
      }

      // Synchroniser les véhicules
      for (const vehicule of localVehicules) {
        const { error } = await supabase
          .from('vehicules')
          .upsert({
            id: vehicule.id,
            immatriculation: vehicule.immatriculation,
            marque: vehicule.marque,
            modele: vehicule.modele,
            annee: vehicule.annee,
            couleur: vehicule.couleur,
            type_carburant: vehicule.typeCarburant,
            capacite_reservoir: vehicule.capaciteReservoir,
            kilometrage: vehicule.kilometrage,
            date_mise_en_service: vehicule.dateAchat || new Date().toISOString().split('T')[0],
            cout_acquisition: vehicule.prixAchat || 0,
            statut: vehicule.statut,
            created_at: vehicule.createdAt,
            updated_at: vehicule.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la synchronisation du véhicule:', vehicule.id, error);
        }
      }

      // Synchroniser les bons
      for (const bon of localBons) {
        const { error } = await supabase
          .from('bons')
          .upsert({
            id: bon.id,
            numero: bon.numero,
            date: bon.date,
            type: bon.type,
            montant: bon.montant,
            distance: bon.distance,
            chauffeur_id: bon.chauffeurId,
            vehicule_id: bon.vehiculeId,
            notes: bon.notes,
            created_at: bon.createdAt,
            updated_at: bon.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la synchronisation du bon:', bon.id, error);
        }
      }

      // Synchroniser les anomalies
      for (const anomalie of localAnomalies) {
        const { error } = await supabase
          .from('anomalies')
          .upsert({
            id: anomalie.id,
            type: anomalie.type,
            description: anomalie.details || '',
            severite: anomalie.gravite,
            statut: anomalie.statut,
            bon_id: anomalie.bonId,
            notes: anomalie.details,
            created_at: anomalie.createdAt,
            updated_at: anomalie.updatedAt
          });

        if (error) {
          console.error('Erreur lors de la synchronisation de l\'anomalie:', anomalie.id, error);
        }
      }

      // Recharger les données depuis la base
      const { data: chauffeursData } = await supabase
        .from('chauffeurs')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: vehiculesData } = await supabase
        .from('vehicules')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: bonsData } = await supabase
        .from('bons')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: anomaliesData } = await supabase
        .from('anomalies')
        .select('*')
        .order('created_at', { ascending: false });

      if (chauffeursData) {
        const mappedChauffeurs = (chauffeursData as DbChauffeur[]).map(mapDbChauffeurToChauffeur);
        setChauffeurs(mappedChauffeurs);
      }
      if (vehiculesData) {
        const mappedVehicules = (vehiculesData as DbVehicule[]).map(mapDbVehiculeToVehicule);
        setVehicules(mappedVehicules);
      }
      if (bonsData) {
        const mappedBons = (bonsData as DbBon[]).map(mapDbBonToBon);
        setBons(mappedBons);
      }
      if (anomaliesData) {
        const mappedAnomalies = (anomaliesData as DbAnomalie[]).map(mapDbAnomalieToAnomalie);
        setAnomalies(mappedAnomalies);
      }

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      throw error;
    }
  };

  // Filtres et statistiques
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
    // Données
    bons,
    chauffeurs,
    vehicules,
    anomalies,
    loading,
    
    // Actions bons
    createBon,
    updateBon,
    deleteBon,
    
    // Actions chauffeurs
    createChauffeur,
    updateChauffeur,
    deleteChauffeur,
    
    // Actions véhicules
    createVehicule,
    updateVehicule,
    deleteVehicule,
    
    // Actions anomalies
    updateAnomalie,
    
    // Utilitaires
    getFilteredBons,
    getStatistics,
    syncWithLocalStorage,
    saveCurrentDataToSupabase
  };
};