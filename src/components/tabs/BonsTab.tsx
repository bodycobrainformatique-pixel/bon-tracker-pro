// Onglet de gestion des bons

import { useState } from 'react';
import { Bon, Chauffeur, Vehicule, BonFilters, Statistics } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BonFormDialog } from '../forms/BonFormDialog';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface BonsTabProps {
  bons: Bon[];
  chauffeurs: Chauffeur[];
  vehicules: Vehicule[];
  filters: BonFilters;
  onFiltersChange: (filters: BonFilters) => void;
  onCreateBon: (bon: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => Bon;
  onUpdateBon: (id: string, updates: Partial<Bon>) => void;
  onDeleteBon: (id: string) => void;
  statistics: Statistics;
}

export const BonsTab = ({
  bons,
  chauffeurs,
  vehicules,
  filters,
  onFiltersChange,
  onCreateBon,
  onUpdateBon,
  onDeleteBon,
  statistics
}: BonsTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBon, setEditingBon] = useState<Bon | null>(null);

  const handleCreateBon = (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      onCreateBon(bonData);
      toast.success('Bon créé avec succès');
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la création du bon');
    }
  };

  const handleUpdateBon = (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingBon) return;
    
    try {
      onUpdateBon(editingBon.id, bonData);
      toast.success('Bon mis à jour avec succès');
      setEditingBon(null);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du bon');
    }
  };

  const handleDeleteBon = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bon ?')) {
      try {
        onDeleteBon(id);
        toast.success('Bon supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du bon');
      }
    }
  };

  const getStatusBadge = (status: Bon['status']) => {
    const styles = {
      draft: 'bg-warning text-warning-foreground',
      completed: 'bg-success text-success-foreground',
      validated: 'bg-info text-info-foreground'
    };
    
    const labels = {
      draft: 'Brouillon',
      completed: 'Terminé',
      validated: 'Validé'
    };

    return (
      <Badge className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: Bon['type']) => {
    return type === 'gasoil' ? (
      <Badge className="bg-fuel text-fuel-foreground">Gasoil</Badge>
    ) : (
      <Badge className="bg-cash text-cash-foreground">Espèces</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestion des Bons</span>
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nouveau Bon</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search || ''}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Input
              type="date"
              placeholder="Du"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            />
            
            <Input
              type="date"
              placeholder="Au"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            />

            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, type: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="gasoil">Gasoil</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {bons.length} bon(s) • Total: {statistics.totalMontant.toFixed(2)}€
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des bons */}
      <div className="grid gap-4">
        {bons.map((bon) => {
          const chauffeur = chauffeurs.find(c => c.id === bon.chauffeurId);
          const vehicule = vehicules.find(v => v.id === bon.vehiculeId);

          return (
            <Card key={bon.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="font-semibold">{bon.numero}</div>
                    <div className="text-sm text-muted-foreground">{bon.date}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {getTypeBadge(bon.type)}
                    {getStatusBadge(bon.status)}
                  </div>

                  <div className="text-center">
                    <div className="font-semibold">{bon.montant.toFixed(2)}€</div>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">
                      {chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'Chauffeur inconnu'}
                    </div>
                    <div className="text-muted-foreground">
                      {vehicule ? vehicule.immatriculation : 'Véhicule inconnu'}
                    </div>
                  </div>

                  <div className="text-center">
                    {bon.kmInitial && bon.kmFinal ? (
                      <div>
                        <div className="font-medium">{bon.distance} km</div>
                        <div className="text-xs text-muted-foreground">
                          {bon.kmInitial} → {bon.kmFinal}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {bon.kmInitial ? `${bon.kmInitial} km` : 'Non renseigné'}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBon(bon)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBon(bon.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {bons.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Aucun bon trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de création/édition */}
      <BonFormDialog
        isOpen={isFormOpen || !!editingBon}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBon(null);
        }}
        onSubmit={editingBon ? handleUpdateBon : handleCreateBon}
        bon={editingBon}
        chauffeurs={chauffeurs}
        vehicules={vehicules}
      />
    </div>
  );
};