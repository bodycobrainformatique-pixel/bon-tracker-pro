// Onglet de gestion des véhicules

import { useState } from 'react';
import { Vehicule } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VehiculeFormDialog } from '../forms/VehiculeFormDialog';
import { Plus, Search, Car } from 'lucide-react';
import { toast } from 'sonner';

interface VehiculesTabProps {
  vehicules: Vehicule[];
  onCreateVehicule: (vehicule: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => Vehicule;
  onUpdateVehicule: (id: string, updates: Partial<Vehicule>) => void;
  onDeleteVehicule: (id: string) => void;
}

export const VehiculesTab = ({
  vehicules,
  onCreateVehicule,
  onUpdateVehicule,
  onDeleteVehicule
}: VehiculesTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState<Vehicule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateVehicule = (vehiculeData: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      onCreateVehicule(vehiculeData);
      toast.success('Véhicule créé avec succès');
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la création du véhicule');
    }
  };

  const handleUpdateVehicule = (vehiculeData: Omit<Vehicule, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingVehicule) return;
    
    try {
      onUpdateVehicule(editingVehicule.id, vehiculeData);
      toast.success('Véhicule mis à jour avec succès');
      setEditingVehicule(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du véhicule');
    }
  };

  const handleDeleteVehicule = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        onDeleteVehicule(id);
        toast.success('Véhicule supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du véhicule');
      }
    }
  };

  const filteredVehicules = vehicules.filter(vehicule =>
    searchTerm === '' ||
    vehicule.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicule.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicule.modele.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestion des Véhicules</span>
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nouveau Véhicule</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par immatriculation, marque ou modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredVehicules.length} véhicule(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des véhicules */}
      <div className="grid gap-4">
        {filteredVehicules.map((vehicule) => (
          <Card key={vehicule.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                <div className="md:col-span-2 flex items-center space-x-3">
                  <div className="bg-primary rounded-lg p-2">
                    <Car className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{vehicule.immatriculation}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicule.marque} {vehicule.modele}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Badge className={vehicule.statut === 'actif' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                    {vehicule.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <div className="text-sm">
                  {vehicule.consommationReference && (
                    <div>
                      <span className="text-muted-foreground">Consommation:</span>
                      <div className="font-medium">{vehicule.consommationReference} L/100km</div>
                    </div>
                  )}
                </div>

                <div className="text-sm">
                  {vehicule.coutKmReference && (
                    <div>
                      <span className="text-muted-foreground">Coût/km:</span>
                      <div className="font-medium">{vehicule.coutKmReference.toFixed(2)}€</div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Créé le {new Date(vehicule.createdAt).toLocaleDateString()}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingVehicule(vehicule)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVehicule(vehicule.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVehicules.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucun véhicule trouvé' : 'Aucun véhicule enregistré'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de création/édition */}
      <VehiculeFormDialog
        isOpen={isFormOpen || !!editingVehicule}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVehicule(null);
        }}
        onSubmit={editingVehicule ? handleUpdateVehicule : handleCreateVehicule}
        vehicule={editingVehicule}
      />
    </div>
  );
};