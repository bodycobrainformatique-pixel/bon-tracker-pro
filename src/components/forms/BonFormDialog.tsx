// Dialog de création/édition d'un bon

import { useState, useEffect } from 'react';
import { Bon, Chauffeur, Vehicule, BonType } from '@/types';
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
  bons: Bon[];
}

export const BonFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  bon,
  chauffeurs,
  vehicules,
  bons
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
        notes: ''
      });
    }
  }, [bon, isOpen]);

  // Auto-set km initial based on last bon's km final for selected vehicle
  useEffect(() => {
    if (!bon && formData.vehiculeId && !formData.kmInitial) {
      // Find the last bon for this vehicle (most recent by date)
      const vehicleBons = bons
        .filter(b => b.vehiculeId === formData.vehiculeId && b.kmFinal)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (vehicleBons.length > 0) {
        const lastBon = vehicleBons[0];
        setFormData(prev => ({ ...prev, kmInitial: lastBon.kmFinal }));
      }
    }
  }, [formData.vehiculeId, bon, bons]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.numero || !formData.chauffeurId || !formData.vehiculeId || formData.montant <= 0) {
      alert('Veuillez remplir tous les champs obligatoires (numéro, chauffeur, véhicule, montant)');
      return;
    }


    // Remove km_final and distance from form data - managed by database trigger
    const { kmFinal, distance, ...submitData } = formData;
    onSubmit(submitData);
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
                  <SelectItem value="essence">Essence</SelectItem>
                  <SelectItem value="gasoil_50">Gasoil 50</SelectItem>
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
                  <Label htmlFor="kmFinal">Km final (automatique)</Label>
                  <Input
                    id="kmFinal"
                    type="number"
                    value={formData.kmFinal || ''}
                    disabled
                    placeholder="Renseigné automatiquement"
                    className="bg-muted"
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