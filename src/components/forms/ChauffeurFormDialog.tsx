// Dialog de création/édition d'un chauffeur

import { useState, useEffect } from 'react';
import { Chauffeur } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChauffeurFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (chauffeur: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => void;
  chauffeur?: Chauffeur | null;
}

export const ChauffeurFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  chauffeur
}: ChauffeurFormDialogProps) => {
  const [formData, setFormData] = useState<Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>>({
    nom: '',
    prenom: '',
    matricule: '',
    telephone: '',
    statut: 'actif'
  });

  useEffect(() => {
    if (chauffeur) {
      setFormData({
        nom: chauffeur.nom,
        prenom: chauffeur.prenom,
        matricule: chauffeur.matricule,
        telephone: chauffeur.telephone,
        statut: chauffeur.statut
      });
    } else {
      // Reset pour nouveau chauffeur
      setFormData({
        nom: '',
        prenom: '',
        matricule: '',
        telephone: '',
        statut: 'actif'
      });
    }
  }, [chauffeur, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.nom || !formData.prenom || !formData.matricule || !formData.telephone) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du téléphone (format basique)
    const phoneRegex = /^[0-9\s+\-()\.]+$/;
    if (!phoneRegex.test(formData.telephone)) {
      alert('Veuillez saisir un numéro de téléphone valide');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {chauffeur ? 'Modifier le chauffeur' : 'Ajouter un nouveau chauffeur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prenom">Prénom *</Label>
            <Input
              id="prenom"
              value={formData.prenom}
              onChange={(e) => handleInputChange('prenom', e.target.value)}
              placeholder="Jean"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              placeholder="Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matricule">Matricule *</Label>
            <Input
              id="matricule"
              value={formData.matricule}
              onChange={(e) => handleInputChange('matricule', e.target.value)}
              placeholder="MAT001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone *</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => handleInputChange('telephone', e.target.value)}
              placeholder="06 12 34 56 78"
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {chauffeur ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};