import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, FileText } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';
import ChauffeurBonForm from '@/components/forms/ChauffeurBonForm';

export default function ChauffeurDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showBonForm, setShowBonForm] = useState(false);
  const [myBons, setMyBons] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/chauffeur/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/chauffeur/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadMyBons();
    }
  }, [user]);

  const loadMyBons = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bons')
        .select(`
          *,
          vehicules(immatriculation, marque, modele),
          chauffeurs(nom, prenom)
        `)
        .eq('chauffeur_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setMyBons(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger vos bons",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/chauffeur/auth');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onBonCreated = () => {
    setShowBonForm(false);
    loadMyBons();
    toast({
      title: "Succès",
      description: "Bon créé avec succès",
    });
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div>Chargement...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Espace Chauffeur</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} size="sm" className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Create New Bon Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowBonForm(true)}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">Nouveau Bon</CardTitle>
              <CardDescription className="text-sm">
                Créer un nouveau bon de carburant
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Recent Bons Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <FileText className="w-5 h-5 mr-2" />
                Mes Derniers Bons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myBons.length > 0 ? (
                <div className="space-y-3">
                  {myBons.map((bon) => (
                    <div key={bon.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-3 bg-muted rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base">Bon #{bon.numero}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {bon.vehicules?.immatriculation} - {new Date(bon.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="font-medium text-sm sm:text-base">{bon.montant} TND</p>
                        <p className="text-xs sm:text-sm text-muted-foreground capitalize">{bon.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun bon créé pour le moment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bon Creation Form Dialog */}
      <ChauffeurBonForm
        isOpen={showBonForm}
        onClose={() => setShowBonForm(false)}
        onSuccess={onBonCreated}
      />
    </div>
  );
}