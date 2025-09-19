// Dialog de création/édition d'un chauffeur avec champs détaillés

import { useState, useEffect } from 'react';
import { Chauffeur } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

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
    email: '',
    adresse: '',
    dateNaissance: '',
    cinNumber: '',
    permisNumber: '',
    dateEmbauche: '',
    salaire: undefined,
    statut: 'actif'
  });

  useEffect(() => {
    if (chauffeur) {
      setFormData({
        nom: chauffeur.nom,
        prenom: chauffeur.prenom,
        matricule: chauffeur.matricule,
        telephone: chauffeur.telephone,
        email: chauffeur.email || '',
        adresse: chauffeur.adresse || '',
        dateNaissance: chauffeur.dateNaissance || '',
        cinNumber: chauffeur.cinNumber || '',
        permisNumber: chauffeur.permisNumber || '',
        dateEmbauche: chauffeur.dateEmbauche || '',
        salaire: chauffeur.salaire,
        statut: chauffeur.statut
      });
    } else {
      // Reset pour nouveau chauffeur
      setFormData({
        nom: '',
        prenom: '',
        matricule: '',
        telephone: '',
        email: '',
        adresse: '',
        dateNaissance: '',
        cinNumber: '',
        permisNumber: '',
        dateEmbauche: '',
        salaire: undefined,
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

    // Validation du téléphone tunisien
    const phoneRegex = /^(\+216|00216|216)?[-\s]?[2459]\d{7}$/;
    if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
      alert('Veuillez saisir un numéro de téléphone tunisien valide');
      return;
    }

    // Validation de l'email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Veuillez saisir une adresse email valide');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {chauffeur ? 'Modifier le chauffeur' : 'Ajouter un nouveau chauffeur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Ben Ahmed"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    placeholder="Mohamed"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    value={formData.dateNaissance || ''}
                    onChange={(e) => handleInputChange('dateNaissance', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cinNumber">N° CIN</Label>
                  <Input
                    id="cinNumber"
                    value={formData.cinNumber || ''}
                    onChange={(e) => handleInputChange('cinNumber', e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Coordonnées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    placeholder="+216 98 123 456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="mohamed.benahmed@email.tn"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse || ''}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  placeholder="Rue de la République, Tunis 1001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricule">Matricule *</Label>
                  <Input
                    id="matricule"
                    value={formData.matricule}
                    onChange={(e) => handleInputChange('matricule', e.target.value)}
                    placeholder="CHAUF001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permisNumber">N° Permis de conduire</Label>
                  <Input
                    id="permisNumber"
                    value={formData.permisNumber || ''}
                    onChange={(e) => handleInputChange('permisNumber', e.target.value)}
                    placeholder="P123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                  <Input
                    id="dateEmbauche"
                    type="date"
                    value={formData.dateEmbauche || ''}
                    onChange={(e) => handleInputChange('dateEmbauche', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaire">Salaire (TND)</Label>
                  <Input
                    id="salaire"
                    type="number"
                    min="0"
                    step="10"
                    value={formData.salaire || ''}
                    onChange={(e) => handleInputChange('salaire', parseFloat(e.target.value) || undefined)}
                    placeholder="1200"
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
            </CardContent>
          </Card>

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