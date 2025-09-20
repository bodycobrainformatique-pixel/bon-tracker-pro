// Dialog de création/édition d'un véhicule

import { useState, useEffect } from 'react';
import { Vehicule } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface VehiculeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vehicule: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  vehicule?: Vehicule | null;
}

export const VehiculeFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  vehicule
}: VehiculeFormDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    immatriculation: '',
    type_carburant: 'gasoil' as 'gasoil' | 'essence' | 'gasoil_50',
    marque: '',
    modele: '',
    annee: undefined as number | undefined,
    couleur: '',
    capacite_reservoir: undefined as number | undefined,
    notes: ''
  });

  useEffect(() => {
    if (vehicule) {
      setFormData({
        immatriculation: vehicule.immatriculation,
        type_carburant: vehicule.typeCarburant || 'gasoil',
        marque: vehicule.marque || '',
        modele: vehicule.modele || '',
        annee: vehicule.annee,
        couleur: vehicule.couleur || '',
        capacite_reservoir: vehicule.capaciteReservoir,
        notes: vehicule.numeroSerie || ''
      });
    } else {
      // Reset pour nouveau véhicule
      setFormData({
        immatriculation: '',
        type_carburant: 'gasoil',
        marque: '',
        modele: '',
        annee: undefined,
        couleur: '',
        capacite_reservoir: undefined,
        notes: ''
      });
    }
  }, [vehicule, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique - seulement immatriculation et type carburant obligatoires
    if (!formData.immatriculation || !formData.type_carburant) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "L'immatriculation et le type de carburant sont obligatoires"
      });
      return;
    }

    // Validation optionnelle de l'année si renseignée
    if (formData.annee && (formData.annee < 1900 || formData.annee > new Date().getFullYear() + 1)) {
      toast({
        variant: "destructive",
        title: "Année invalide",
        description: "L'année doit être comprise entre 1900 et l'année prochaine"
      });
      return;
    }

    // Validation optionnelle de la capacité si renseignée
    if (formData.capacite_reservoir && (formData.capacite_reservoir <= 0 || formData.capacite_reservoir > 1000)) {
      toast({
        variant: "destructive",
        title: "Capacité de réservoir invalide",
        description: "La capacité doit être comprise entre 1 et 1000 litres"
      });
      return;
    }

    // Map to expected Vehicule interface
    const submitData = {
      immatriculation: formData.immatriculation,
      marque: formData.marque || '',
      modele: formData.modele || '',
      annee: formData.annee,
      couleur: formData.couleur || '',
      typeCarburant: formData.type_carburant,
      capaciteReservoir: formData.capacite_reservoir,
      kilometrage: 0, // Auto-computed from bons
      dateAchat: '',
      prixAchat: 0,
      numeroSerie: formData.notes || '',
      statut: 'actif' as const
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicule ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="immatriculation">Immatriculation *</Label>
              <Input
                id="immatriculation"
                value={formData.immatriculation}
                onChange={(e) => handleInputChange('immatriculation', e.target.value.toUpperCase())}
                placeholder="123 TUN 1234"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_carburant">Type de carburant *</Label>
              <Select
                value={formData.type_carburant}
                onValueChange={(value: 'gasoil' | 'essence' | 'gasoil_50') => 
                  handleInputChange('type_carburant', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoil">Gasoil</SelectItem>
                  <SelectItem value="essence">Essence</SelectItem>
                  <SelectItem value="gasoil_50">Gasoil 50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marque">Marque</Label>
              <Input
                id="marque"
                value={formData.marque}
                onChange={(e) => handleInputChange('marque', e.target.value)}
                placeholder="Toyota, Renault, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => handleInputChange('modele', e.target.value)}
                placeholder="Corolla, Clio, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.annee || ''}
                onChange={(e) => handleInputChange('annee', parseInt(e.target.value) || undefined)}
                placeholder="2020"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleur">Couleur</Label>
              <Input
                id="couleur"
                value={formData.couleur}
                onChange={(e) => handleInputChange('couleur', e.target.value)}
                placeholder="Blanc, Noir, Rouge, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacite_reservoir">Capacité du réservoir (L)</Label>
              <Input
                id="capacite_reservoir"
                type="number"
                min="1"
                max="1000"
                step="0.1"
                value={formData.capacite_reservoir || ''}
                onChange={(e) => handleInputChange('capacite_reservoir', parseFloat(e.target.value) || undefined)}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {vehicule ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};