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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Espace Chauffeur</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create New Bon Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowBonForm(true)}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle>Nouveau Bon</CardTitle>
              <CardDescription>
                Créer un nouveau bon de carburant
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Recent Bons Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Mes Derniers Bons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myBons.length > 0 ? (
                <div className="space-y-3">
                  {myBons.map((bon) => (
                    <div key={bon.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Bon #{bon.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {bon.vehicules?.immatriculation} - {new Date(bon.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{bon.montant} TND</p>
                        <p className="text-sm text-muted-foreground capitalize">{bon.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucun bon créé pour le moment
                </p>
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