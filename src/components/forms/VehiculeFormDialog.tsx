// Dialog de création/édition d'un véhicule

import { useState, useEffect } from 'react';
import { Vehicule } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [formData, setFormData] = useState<Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>>({
    immatriculation: '',
    marque: '',
    modele: '',
    statut: 'actif',
    consommationReference: undefined,
    coutKmReference: undefined
  });

  useEffect(() => {
    if (vehicule) {
      setFormData({
        immatriculation: vehicule.immatriculation,
        marque: vehicule.marque,
        modele: vehicule.modele,
        statut: vehicule.statut,
        consommationReference: vehicule.consommationReference,
        coutKmReference: vehicule.coutKmReference
      });
    } else {
      // Reset pour nouveau véhicule
      setFormData({
        immatriculation: '',
        marque: '',
        modele: '',
        statut: 'actif',
        consommationReference: undefined,
        coutKmReference: undefined
      });
    }
  }, [vehicule, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.immatriculation || !formData.marque || !formData.modele) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation de l'immatriculation (format basique français)
    const immatRegex = /^[A-Z]{1,2}[-\s]?\d{3}[-\s]?[A-Z]{1,3}$/i;
    if (!immatRegex.test(formData.immatriculation.replace(/\s/g, ''))) {
      alert('Veuillez saisir une immatriculation valide (ex: AB-123-CD)');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vehicule ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="immatriculation">Immatriculation *</Label>
            <Input
              id="immatriculation"
              value={formData.immatriculation}
              onChange={(e) => handleInputChange('immatriculation', e.target.value.toUpperCase())}
              placeholder="AB-123-CD"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marque">Marque *</Label>
            <Input
              id="marque"
              value={formData.marque}
              onChange={(e) => handleInputChange('marque', e.target.value)}
              placeholder="Renault"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modele">Modèle *</Label>
            <Input
              id="modele"
              value={formData.modele}
              onChange={(e) => handleInputChange('modele', e.target.value)}
              placeholder="Master"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select
              value={formData.statut}
              onValueChange={(value: 'actif' | 'inactif') => handleInputChange('statut', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consommation">Consommation de référence (L/100km)</Label>
            <Input
              id="consommation"
              type="number"
              step="0.1"
              min="0"
              value={formData.consommationReference || ''}
              onChange={(e) => handleInputChange('consommationReference', parseFloat(e.target.value) || undefined)}
              placeholder="8.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cout">Coût de référence (€/km)</Label>
            <Input
              id="cout"
              type="number"
              step="0.01"
              min="0"
              value={formData.coutKmReference || ''}
              onChange={(e) => handleInputChange('coutKmReference', parseFloat(e.target.value) || undefined)}
              placeholder="0.35"
            />
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