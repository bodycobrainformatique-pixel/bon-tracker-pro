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
  const [formData, setFormData] = useState<Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>>({
    immatriculation: '',
    marque: '',
    modele: '',
    annee: new Date().getFullYear(),
    couleur: '',
    typeCarburant: 'gasoil',
    capaciteReservoir: 50,
    kilometrage: 0,
    dateAchat: '',
    prixAchat: 0,
    numeroSerie: '',
    statut: 'actif'
  });

  useEffect(() => {
    if (vehicule) {
      setFormData({
        immatriculation: vehicule.immatriculation,
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee || new Date().getFullYear(),
        couleur: vehicule.couleur || '',
        typeCarburant: vehicule.typeCarburant || 'gasoil',
        capaciteReservoir: vehicule.capaciteReservoir || 50,
        kilometrage: vehicule.kilometrage || 0,
        dateAchat: vehicule.dateAchat || '',
        prixAchat: vehicule.prixAchat || 0,
        numeroSerie: vehicule.numeroSerie || '',
        statut: vehicule.statut
      });
    } else {
      // Reset pour nouveau véhicule
      setFormData({
        immatriculation: '',
        marque: '',
        modele: '',
        annee: new Date().getFullYear(),
        couleur: '',
        typeCarburant: 'gasoil',
        capaciteReservoir: 50,
        kilometrage: 0,
        dateAchat: '',
        prixAchat: 0,
        numeroSerie: '',
        statut: 'actif'
      });
    }
  }, [vehicule, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.immatriculation || !formData.marque || !formData.modele || !formData.couleur) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    // Validation de l'immatriculation tunisienne (format: 123 TUN 1234)
    const immatRegex = /^\d{1,3}[-\s]?TUN[-\s]?\d{1,4}$/i;
    if (!immatRegex.test(formData.immatriculation.replace(/\s/g, ''))) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Veuillez saisir une immatriculation tunisienne valide (ex: 123 TUN 1234)"
      });
      return;
    }

    // Validation des champs numériques
    if (!formData.annee || formData.annee < 1900 || formData.annee > new Date().getFullYear() + 1) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Veuillez saisir une année valide"
      });
      return;
    }

    if (!formData.capaciteReservoir || formData.capaciteReservoir <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "La capacité du réservoir doit être supérieure à 0"
      });
      return;
    }

    if (!formData.prixAchat || formData.prixAchat < 0) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Le prix d'achat doit être supérieur ou égal à 0"
      });
      return;
    }

    // Préparer les données pour l'envoi
    const submitData = {
      ...formData,
      // Convertir les champs vides en null pour les champs optionnels
      dateAchat: formData.dateAchat || null,
      numeroSerie: formData.numeroSerie || null
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
              <Label htmlFor="annee">Année *</Label>
              <Input
                id="annee"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.annee || ''}
                onChange={(e) => handleInputChange('annee', parseInt(e.target.value) || new Date().getFullYear())}
                placeholder="2023"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleur">Couleur *</Label>
              <Input
                id="couleur"
                value={formData.couleur}
                onChange={(e) => handleInputChange('couleur', e.target.value)}
                placeholder="Blanc"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeCarburant">Type de carburant *</Label>
              <Select
                value={formData.typeCarburant}
                onValueChange={(value: 'gasoil' | 'essence' | 'gasoil_50') => handleInputChange('typeCarburant', value)}
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
              <Label htmlFor="capaciteReservoir">Capacité réservoir (L) *</Label>
              <Input
                id="capaciteReservoir"
                type="number"
                min="1"
                step="1"
                value={formData.capaciteReservoir || ''}
                onChange={(e) => handleInputChange('capaciteReservoir', parseInt(e.target.value) || 50)}
                placeholder="50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilometrage">Kilométrage actuel</Label>
              <Input
                id="kilometrage"
                type="number"
                min="0"
                step="1"
                value={formData.kilometrage || ''}
                onChange={(e) => handleInputChange('kilometrage', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAchat">Date d'achat</Label>
              <Input
                id="dateAchat"
                type="date"
                value={formData.dateAchat || ''}
                onChange={(e) => handleInputChange('dateAchat', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prixAchat">Prix d'achat (TND) *</Label>
              <Input
                id="prixAchat"
                type="number"
                min="0"
                step="100"
                value={formData.prixAchat || ''}
                onChange={(e) => handleInputChange('prixAchat', parseFloat(e.target.value) || 0)}
                placeholder="25000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">N° de série</Label>
              <Input
                id="numeroSerie"
                value={formData.numeroSerie || ''}
                onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
                placeholder="VF1MA000123456789"
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