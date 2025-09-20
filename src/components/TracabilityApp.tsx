// Composant principal de l'application de traçabilité

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOptimizedSupabaseData } from '@/hooks/useOptimizedSupabaseData';
import { BonFilters, Bon, Chauffeur, Vehicule, Anomalie } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BonsTab } from './tabs/BonsTab';
import { ChauffeursTab } from './tabs/ChauffeursTab';
import { VehiculesTab } from './tabs/VehiculesTab';
import { AnomaliesTab } from './tabs/AnomaliesTab';
import { RapportsTab } from './tabs/RapportsTab';
import { ParametresTab } from './tabs/ParametresTab';
import { StatsBar } from './StatsBar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Truck, Users, FileText, AlertTriangle, LogOut, Save, Settings } from 'lucide-react';

export const TracabilityApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    bons,
    chauffeurs,
    vehicules,
    anomalies,
    loading,
    createBon,
    updateBon: updateBonBase,
    deleteBon,
    createChauffeur,
    updateChauffeur: updateChauffeurBase,
    deleteChauffeur,
    createVehicule,
    updateVehicule: updateVehiculeBase,
    deleteVehicule,
    updateAnomalie: updateAnomalieBase,
    getFilteredBons,
    getStatistics
  } = useOptimizedSupabaseData();

  // Wrapper functions to match expected signatures
  const updateBon = async (id: string, updates: Partial<Bon>) => {
    await updateBonBase(id, updates);
  };

  const updateChauffeur = async (id: string, updates: Partial<Chauffeur>) => {
    await updateChauffeurBase(id, updates);
  };

  const updateVehicule = async (id: string, updates: Partial<Vehicule>) => {
    await updateVehiculeBase(id, updates);
  };

  const updateAnomalie = async (id: string, updates: Partial<Anomalie>) => {
    await updateAnomalieBase(id, updates);
  };

  const [activeTab, setActiveTab] = useState('bons');
  const [bonFilters, setBonFilters] = useState<BonFilters>({});

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user && event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté",
      });
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur s'est produite lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  // Real-time sync - no manual save needed
  const handleSaveToDatabase = async () => {
    toast({
      title: "Synchronisation automatique",
      description: "Les données sont automatiquement synchronisées en temps réel",
    });
  };

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
                  Connecté en tant que: {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <StatsBar statistics={statistics} />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                  variant="default"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
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
            <TabsTrigger value="rapports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Rapports</span>
            </TabsTrigger>
            <TabsTrigger value="parametres" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
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

          <TabsContent value="rapports" className="space-y-6">
            <RapportsTab vehicules={vehicules} />
          </TabsContent>

          <TabsContent value="parametres" className="space-y-6">
            <ParametresTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};