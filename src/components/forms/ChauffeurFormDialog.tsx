import { useState, useEffect } from 'react';
import { Chauffeur } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    telephone: '',
    email: '',
    adresse: '',
    statut: 'actif' as 'actif' | 'inactif'
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
        statut: chauffeur.statut
      });
    } else {
      setFormData({
        nom: '',
        prenom: '',
        matricule: '',
        telephone: '',
        email: '',
        adresse: '',
        statut: 'actif'
      });
    }
  }, [chauffeur, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.nom || !formData.prenom || !formData.matricule || !formData.telephone) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Les champs nom, prénom, matricule et téléphone sont obligatoires"
      });
      return;
    }

    const submitData = {
      nom: formData.nom,
      prenom: formData.prenom,
      matricule: formData.matricule,
      telephone: formData.telephone,
      email: formData.email || undefined,
      adresse: formData.adresse || undefined,
      statut: formData.statut
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
            {chauffeur ? 'Modifier le chauffeur' : 'Ajouter un nouveau chauffeur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  placeholder="Nom de famille"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleInputChange('prenom', e.target.value)}
                  placeholder="Prénom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule/CIN *</Label>
                <Input
                  id="matricule"
                  value={formData.matricule}
                  onChange={(e) => handleInputChange('matricule', e.target.value)}
                  placeholder="12345678 ou MAT001"
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
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Coordonnées</h3>
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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="chauffeur@example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  placeholder="Adresse complète"
                />
              </div>
            </div>
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