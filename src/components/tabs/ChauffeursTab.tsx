// Onglet de gestion des chauffeurs

import { useState } from 'react';
import { Chauffeur } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChauffeurFormDialog } from '../forms/ChauffeurFormDialog';
import { Plus, Search, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface ChauffeursTabProps {
  chauffeurs: Chauffeur[];
  onCreateChauffeur: (chauffeur: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => Chauffeur;
  onUpdateChauffeur: (id: string, updates: Partial<Chauffeur>) => void;
  onDeleteChauffeur: (id: string) => void;
}

export const ChauffeursTab = ({
  chauffeurs,
  onCreateChauffeur,
  onUpdateChauffeur,
  onDeleteChauffeur
}: ChauffeursTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState<Chauffeur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateChauffeur = (chauffeurData: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      onCreateChauffeur(chauffeurData);
      toast.success('Chauffeur créé avec succès');
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la création du chauffeur');
    }
  };

  const handleUpdateChauffeur = (chauffeurData: Omit<Chauffeur, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingChauffeur) return;
    
    try {
      onUpdateChauffeur(editingChauffeur.id, chauffeurData);
      toast.success('Chauffeur mis à jour avec succès');
      setEditingChauffeur(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du chauffeur');
    }
  };

  const handleDeleteChauffeur = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        onDeleteChauffeur(id);
        toast.success('Chauffeur supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du chauffeur');
      }
    }
  };

  const filteredChauffeurs = chauffeurs.filter(chauffeur =>
    searchTerm === '' ||
    chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestion des Chauffeurs</span>
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nouveau Chauffeur</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredChauffeurs.length} chauffeur(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des chauffeurs */}
      <div className="grid gap-4">
        {filteredChauffeurs.map((chauffeur) => (
          <Card key={chauffeur.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div className="md:col-span-2">
                  <div className="font-semibold">
                    {chauffeur.prenom} {chauffeur.nom}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Matricule: {chauffeur.matricule}
                  </div>
                  {chauffeur.email && (
                    <div className="text-xs text-muted-foreground">
                      {chauffeur.email}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">{chauffeur.telephone}</div>
                    {chauffeur.adresse && (
                      <div className="text-xs text-muted-foreground">
                        {chauffeur.adresse}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Badge className={chauffeur.statut === 'actif' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                    {chauffeur.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </Badge>
                  {chauffeur.salaire && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {chauffeur.salaire.toLocaleString()} TND/mois
                    </div>
                  )}
                </div>

                <div className="text-sm">
                  {chauffeur.dateEmbauche && (
                    <div>
                      <span className="text-muted-foreground">Embauche:</span>
                      <div className="font-medium">{new Date(chauffeur.dateEmbauche).toLocaleDateString()}</div>
                    </div>
                  )}
                  {chauffeur.permisNumber && (
                    <div className="text-xs text-muted-foreground">
                      Permis: {chauffeur.permisNumber}
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {chauffeur.cinNumber && (
                    <div className="mb-1">CIN: {chauffeur.cinNumber}</div>
                  )}
                  Créé le {new Date(chauffeur.createdAt).toLocaleDateString()}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingChauffeur(chauffeur)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteChauffeur(chauffeur.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredChauffeurs.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucun chauffeur trouvé' : 'Aucun chauffeur enregistré'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de création/édition */}
      <ChauffeurFormDialog
        isOpen={isFormOpen || !!editingChauffeur}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChauffeur(null);
        }}
        onSubmit={editingChauffeur ? handleUpdateChauffeur : handleCreateChauffeur}
        chauffeur={editingChauffeur}
      />
    </div>
  );
};