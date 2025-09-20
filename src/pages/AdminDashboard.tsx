import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsBar } from '@/components/StatsBar';
import { BonsTab } from '@/components/tabs/BonsTab';
import { ChauffeursTab } from '@/components/tabs/ChauffeursTab';
import { VehiculesTab } from '@/components/tabs/VehiculesTab';
import { AnomaliesTab } from '@/components/tabs/AnomaliesTab';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { LogOut, Save, Download, Upload } from 'lucide-react';

export default function AdminDashboard() {
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
    getStatistics,
    syncWithLocalStorage
  } = useSupabaseData();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user && event === 'SIGNED_OUT') {
          navigate('/admin/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/admin/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de l'interface d'administration",
      });
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur s'est produite lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      await syncWithLocalStorage();
      toast({
        title: "Données synchronisées",
        description: "Toutes les données ont été sauvegardées dans la base de données",
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur s'est produite lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de l'interface d'administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Administration - Traçabilité des Bons</h1>
              <p className="text-muted-foreground">
                Connecté en tant que: {user?.email}
              </p>
            </div>
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
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <StatsBar
            statistics={getStatistics(bons)}
          />

          <Tabs defaultValue="bons" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bons">Bons</TabsTrigger>
              <TabsTrigger value="chauffeurs">Chauffeurs</TabsTrigger>
              <TabsTrigger value="vehicules">Véhicules</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            </TabsList>

            <TabsContent value="bons">
              <BonsTab
                bons={bons}
                chauffeurs={chauffeurs}
                vehicules={vehicules}
                filters={{}}
                onFiltersChange={() => {}}
                statistics={getStatistics(bons)}
                onCreateBon={(bon) => {
                  createBon(bon).catch(error => {
                    console.error('Error creating bon:', error);
                  });
                  // Return a temporary object for immediate UI update
                  return {
                    ...bon,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                }}
                onUpdateBon={updateBon}
                onDeleteBon={deleteBon}
              />
            </TabsContent>

            <TabsContent value="chauffeurs">
              <ChauffeursTab
                chauffeurs={chauffeurs}
                onCreateChauffeur={(chauffeur) => {
                  createChauffeur(chauffeur).catch(error => {
                    console.error('Error creating chauffeur:', error);
                  });
                  // Return a temporary object for immediate UI update
                  return {
                    ...chauffeur,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                }}
                onUpdateChauffeur={updateChauffeur}
                onDeleteChauffeur={deleteChauffeur}
              />
            </TabsContent>

            <TabsContent value="vehicules">
              <VehiculesTab
                vehicules={vehicules}
                onCreateVehicule={(vehicule) => {
                  createVehicule(vehicule).catch(error => {
                    console.error('Error creating vehicule:', error);
                  });
                  // Return a temporary object for immediate UI update
                  return {
                    ...vehicule,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                }}
                onUpdateVehicule={updateVehicule}
                onDeleteVehicule={deleteVehicule}
              />
            </TabsContent>

            <TabsContent value="anomalies">
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
      </main>
    </div>
  );
}