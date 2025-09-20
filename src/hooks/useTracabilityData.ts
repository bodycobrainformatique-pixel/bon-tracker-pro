// Hook pour la gestion des données de traçabilité

import { useState, useEffect } from 'react';
import { Bon, Chauffeur, Vehicule, Anomalie, BonFilters, Statistics } from '@/types';
import { StorageService, KEYS } from '@/lib/storage';
import { seedBons, seedChauffeurs, seedVehicules, seedAnomalies } from '@/lib/seedData';
import { detectAnomalies } from '@/lib/anomaliesDetection';

export const useTracabilityData = () => {
  const [bons, setBons] = useState<Bon[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialisation des données
  useEffect(() => {
    const initializeData = () => {
      // Charger ou initialiser avec les données de seed
      const storedBons = StorageService.get<Bon[]>(KEYS.BONS, seedBons);
      const storedChauffeurs = StorageService.get<Chauffeur[]>(KEYS.CHAUFFEURS, seedChauffeurs);
      const storedVehicules = StorageService.get<Vehicule[]>(KEYS.VEHICULES, seedVehicules);
      const storedAnomalies = StorageService.get<Anomalie[]>(KEYS.ANOMALIES, seedAnomalies);

      setBons(storedBons);
      setChauffeurs(storedChauffeurs);
      setVehicules(storedVehicules);
      setAnomalies(storedAnomalies);
      setLoading(false);
    };

    initializeData();
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    if (!loading) {
      StorageService.set(KEYS.BONS, bons);
    }
  }, [bons, loading]);

  useEffect(() => {
    if (!loading) {
      StorageService.set(KEYS.CHAUFFEURS, chauffeurs);
    }
  }, [chauffeurs, loading]);

  useEffect(() => {
    if (!loading) {
      StorageService.set(KEYS.VEHICULES, vehicules);
    }
  }, [vehicules, loading]);

  useEffect(() => {
    if (!loading) {
      StorageService.set(KEYS.ANOMALIES, anomalies);
    }
  }, [anomalies, loading]);

  // Fonctions CRUD pour les bons
  const createBon = (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBon: Bon = {
      ...bonData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBons(prev => [newBon, ...prev]);
    
    // Détection d'anomalies
    const newAnomalies = detectAnomalies(newBon, bons, chauffeurs, vehicules);
    if (newAnomalies.length > 0) {
      setAnomalies(prev => [...newAnomalies, ...prev]);
    }

    return newBon;
  };

  const updateBon = (id: string, updates: Partial<Bon>) => {
    setBons(prev => prev.map(bon => 
      bon.id === id 
        ? { ...bon, ...updates, updatedAt: new Date().toISOString() }
        : bon
    ));
  };

  const deleteBon = (id: string) => {
    setBons(prev => prev.filter(bon => bon.id !== id));
    setAnomalies(prev => prev.filter(anomalie => anomalie.bonId !== id));
  };

  // Fonctions CRUD pour les chauffeurs
  const createChauffeur = (chauffeurData: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newChauffeur: Chauffeur = {
      ...chauffeurData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setChauffeurs(prev => [newChauffeur, ...prev]);
    return newChauffeur;
  };

  const updateChauffeur = (id: string, updates: Partial<Chauffeur>) => {
    setChauffeurs(prev => prev.map(chauffeur => 
      chauffeur.id === id 
        ? { ...chauffeur, ...updates, updatedAt: new Date().toISOString() }
        : chauffeur
    ));
  };

  const deleteChauffeur = (id: string) => {
    setChauffeurs(prev => prev.filter(chauffeur => chauffeur.id !== id));
  };

  // Fonctions CRUD pour les véhicules
  const createVehicule = (vehiculeData: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVehicule: Vehicule = {
      ...vehiculeData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setVehicules(prev => [newVehicule, ...prev]);
    return newVehicule;
  };

  const updateVehicule = (id: string, updates: Partial<Vehicule>) => {
    setVehicules(prev => prev.map(vehicule => 
      vehicule.id === id 
        ? { ...vehicule, ...updates, updatedAt: new Date().toISOString() }
        : vehicule
    ));
  };

  const deleteVehicule = (id: string) => {
    setVehicules(prev => prev.filter(vehicule => vehicule.id !== id));
  };

  // Fonctions pour les anomalies
  const updateAnomalie = (id: string, updates: Partial<Anomalie>) => {
    setAnomalies(prev => prev.map(anomalie => 
      anomalie.id === id 
        ? { ...anomalie, ...updates, updatedAt: new Date().toISOString() }
        : anomalie
    ));
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
    getStatistics
  };
};