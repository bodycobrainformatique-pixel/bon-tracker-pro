// Dialog de création/édition d'un bon

import { useState, useEffect } from 'react';
import { Bon, Chauffeur, Vehicule, BonType, BonStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface BonFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bon: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => void;
  bon?: Bon | null;
  chauffeurs: Chauffeur[];
  vehicules: Vehicule[];
}

export const BonFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  bon,
  chauffeurs,
  vehicules
}: BonFormDialogProps) => {
  const [formData, setFormData] = useState<Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>>({
    numero: '',
    date: new Date().toISOString().split('T')[0],
    type: 'gasoil',
    montant: 0,
    chauffeurId: '',
    vehiculeId: '',
    kmInitial: undefined,
    kmFinal: undefined,
    distance: undefined,
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
    if (bon) {
      setFormData({
        numero: bon.numero,
        date: bon.date,
        type: bon.type,
        montant: bon.montant,
        chauffeurId: bon.chauffeurId,
        vehiculeId: bon.vehiculeId,
        kmInitial: bon.kmInitial,
        kmFinal: bon.kmFinal,
        distance: bon.distance,
        status: bon.status,
        notes: bon.notes || ''
      });
    } else {
      // Reset pour nouveau bon
      setFormData({
        numero: `BON${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        type: 'gasoil',
        montant: 0,
        chauffeurId: '',
        vehiculeId: '',
        kmInitial: undefined,
        kmFinal: undefined,
        distance: undefined,
        status: 'draft',
        notes: ''
      });
    }
  }, [bon, isOpen]);

  // Calcul automatique de la distance
  useEffect(() => {
    if (formData.kmInitial && formData.kmFinal) {
      const distance = formData.kmFinal - formData.kmInitial;
      setFormData(prev => ({ ...prev, distance }));
    }
  }, [formData.kmInitial, formData.kmFinal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.numero || !formData.chauffeurId || !formData.vehiculeId || formData.montant <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const activeChauffeurs = chauffeurs.filter(c => c.statut === 'actif');
  const activeVehicules = vehicules.filter(v => v.statut === 'actif');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bon ? 'Modifier le bon' : 'Créer un nouveau bon'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Numéro de bon *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="BON001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: BonType) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoil">Gasoil</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant">Montant (TND) *</Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                min="0"
                value={formData.montant}
                onChange={(e) => handleInputChange('montant', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chauffeur">Chauffeur *</Label>
              <Select
                value={formData.chauffeurId}
                onValueChange={(value) => handleInputChange('chauffeurId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {activeChauffeurs.map(chauffeur => (
                    <SelectItem key={chauffeur.id} value={chauffeur.id}>
                      {chauffeur.prenom} {chauffeur.nom} ({chauffeur.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicule">Véhicule *</Label>
              <Select
                value={formData.vehiculeId}
                onValueChange={(value) => handleInputChange('vehiculeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {activeVehicules.map(vehicule => (
                    <SelectItem key={vehicule.id} value={vehicule.id}>
                      {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: BonStatus) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section kilométrage */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Kilométrage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kmInitial">Km initial</Label>
                  <Input
                    id="kmInitial"
                    type="number"
                    min="0"
                    value={formData.kmInitial || ''}
                    onChange={(e) => handleInputChange('kmInitial', parseInt(e.target.value) || undefined)}
                    placeholder="45230"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kmFinal">Km final</Label>
                  <Input
                    id="kmFinal"
                    type="number"
                    min="0"
                    value={formData.kmFinal || ''}
                    onChange={(e) => handleInputChange('kmFinal', parseInt(e.target.value) || undefined)}
                    placeholder="45380"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Distance calculée</Label>
                  <Input
                    value={formData.distance ? `${formData.distance} km` : ''}
                    disabled
                    placeholder="Calculée automatiquement"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {bon ? 'Mettre à jour' : 'Créer le bon'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};