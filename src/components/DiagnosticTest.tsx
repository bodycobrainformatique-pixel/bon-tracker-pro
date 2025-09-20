// Quick diagnostic component to test form functionality
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VehiculeFormDialog } from '@/components/forms/VehiculeFormDialog';
import { ChauffeurFormDialog } from '@/components/forms/ChauffeurFormDialog';
import { BonFormDialog } from '@/components/forms/BonFormDialog';
import { useOptimizedSupabaseData } from '@/hooks/useOptimizedSupabaseData';
import { useToast } from '@/hooks/use-toast';

export const DiagnosticTest = () => {
  const [showVehiculeForm, setShowVehiculeForm] = useState(false);
  const [showChauffeurForm, setShowChauffeurForm] = useState(false);
  const [showBonForm, setShowBonForm] = useState(false);
  const { toast } = useToast();
  
  const {
    bons,
    chauffeurs,
    vehicules,
    createVehicule,
    createChauffeur,
    createBon,
    loading
  } = useOptimizedSupabaseData();

  const handleCreateVehicule = async (vehiculeData: any) => {
    try {
      await createVehicule(vehiculeData);
      toast({
        title: "✅ Véhicule créé",
        description: "Le véhicule a été ajouté avec succès"
      });
      setShowVehiculeForm(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: error.message || "Erreur lors de la création du véhicule"
      });
    }
  };

  const handleCreateChauffeur = async (chauffeurData: any) => {
    try {
      await createChauffeur(chauffeurData);
      toast({
        title: "✅ Chauffeur créé",
        description: "Le chauffeur a été ajouté avec succès"
      });
      setShowChauffeurForm(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: error.message || "Erreur lors de la création du chauffeur"
      });
    }
  };

  const handleCreateBon = async (bonData: any) => {
    try {
      await createBon(bonData);
      toast({
        title: "✅ Bon créé",
        description: "Le bon a été ajouté avec succès"
      });
      setShowBonForm(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Erreur", 
        description: error.message || "Erreur lors de la création du bon"
      });
    }
  };

  if (loading) return <div>Chargement des données...</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">🔧 Test des Formulaires</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Véhicules ({vehicules.length})</h3>
          <Button onClick={() => setShowVehiculeForm(true)}>
            ➕ Test Nouveau Véhicule
          </Button>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Chauffeurs ({chauffeurs.length})</h3>
          <Button onClick={() => setShowChauffeurForm(true)}>
            ➕ Test Nouveau Chauffeur
          </Button>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Bons ({bons.length})</h3>
          <Button 
            onClick={() => setShowBonForm(true)}
            disabled={vehicules.length === 0 || chauffeurs.length === 0}
          >
            ➕ Test Nouveau Bon
          </Button>
          {(vehicules.length === 0 || chauffeurs.length === 0) && (
            <p className="text-sm text-red-500 mt-2">
              ⚠️ Il faut des véhicules ET des chauffeurs
            </p>
          )}
        </div>
      </div>

      <VehiculeFormDialog
        isOpen={showVehiculeForm}
        onClose={() => setShowVehiculeForm(false)}
        onSubmit={handleCreateVehicule}
      />

      <ChauffeurFormDialog
        isOpen={showChauffeurForm}
        onClose={() => setShowChauffeurForm(false)}
        onSubmit={handleCreateChauffeur}
      />

      {(showBonForm && vehicules.length > 0 && chauffeurs.length > 0) && (
        <BonFormDialog
          isOpen={showBonForm}
          onClose={() => setShowBonForm(false)}
          onSubmit={handleCreateBon}
          chauffeurs={chauffeurs}
          vehicules={vehicules}
          bons={bons}
        />
      )}
    </div>
  );
};