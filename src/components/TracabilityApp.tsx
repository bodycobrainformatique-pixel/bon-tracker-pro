// Composant principal de l'application de traçabilité

import { useState } from 'react';
import { useTracabilityData } from '@/hooks/useTracabilityData';
import { BonFilters } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BonsTab } from './tabs/BonsTab';
import { ChauffeursTab } from './tabs/ChauffeursTab';
import { VehiculesTab } from './tabs/VehiculesTab';
import { AnomaliesTab } from './tabs/AnomaliesTab';
import { StatsBar } from './StatsBar';
import { Truck, Users, FileText, AlertTriangle } from 'lucide-react';

export const TracabilityApp = () => {
  const {
    bons,
    chauffeurs,
    vehicules,
    anomalies,
    loading,
    createBon,
    updateBon,
    deleteBon,
    createChauffeur,
    updateChauffeur,
    deleteChauffeur,
    createVehicule,
    updateVehicule,
    deleteVehicule,
    updateAnomalie,
    getFilteredBons,
    getStatistics
  } = useTracabilityData();

  const [activeTab, setActiveTab] = useState('bons');
  const [bonFilters, setBonFilters] = useState<BonFilters>({});

  const filteredBons = getFilteredBons(bonFilters);
  const statistics = getStatistics(filteredBons);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Traçabilité des Bons
                </h1>
                <p className="text-muted-foreground">
                  Gestion des bons gasoil et espèces
                </p>
              </div>
            </div>
            
            <StatsBar statistics={statistics} />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="bons" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Bons</span>
            </TabsTrigger>
            <TabsTrigger value="chauffeurs" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Chauffeurs</span>
            </TabsTrigger>
            <TabsTrigger value="vehicules" className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Véhicules</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Anomalies</span>
              {anomalies.filter(a => a.statut === 'a_verifier').length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {anomalies.filter(a => a.statut === 'a_verifier').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bons" className="space-y-6">
            <BonsTab
              bons={filteredBons}
              chauffeurs={chauffeurs}
              vehicules={vehicules}
              filters={bonFilters}
              onFiltersChange={setBonFilters}
              onCreateBon={createBon}
              onUpdateBon={updateBon}
              onDeleteBon={deleteBon}
              statistics={statistics}
            />
          </TabsContent>

          <TabsContent value="chauffeurs" className="space-y-6">
            <ChauffeursTab
              chauffeurs={chauffeurs}
              onCreateChauffeur={createChauffeur}
              onUpdateChauffeur={updateChauffeur}
              onDeleteChauffeur={deleteChauffeur}
            />
          </TabsContent>

          <TabsContent value="vehicules" className="space-y-6">
            <VehiculesTab
              vehicules={vehicules}
              onCreateVehicule={createVehicule}
              onUpdateVehicule={updateVehicule}
              onDeleteVehicule={deleteVehicule}
            />
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-6">
            <AnomaliesTab
              anomalies={anomalies}
              bons={bons}
              chauffeurs={chauffeurs}
              vehicules={vehicules}
              onUpdateAnomalie={updateAnomalie}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};