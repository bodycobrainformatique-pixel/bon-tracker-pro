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
import { useToast } from '@/hooks/use-toast';

interface BonsTabProps {
  bons: Bon[];
  chauffeurs: Chauffeur[];
  vehicules: Vehicule[];
  filters: BonFilters;
  onFiltersChange: (filters: BonFilters) => void;
  onCreateBon: (bon: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Bon>;
  onUpdateBon: (id: string, updates: Partial<Bon>) => Promise<void>;
  onDeleteBon: (id: string) => Promise<void>;
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
  const { toast } = useToast();

  const handleCreateBon = async (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('📝 Creating bon from BonsTab:', bonData);
      await onCreateBon(bonData);
      toast({
        title: "✅ Bon créé",
        description: "Le bon a été créé avec succès"
      });
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('❌ Error creating bon in BonsTab:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: error.message || "Erreur lors de la création du bon"
      });
    }
  };

  const handleUpdateBon = async (bonData: Omit<Bon, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingBon) return;
    
    try {
      await onUpdateBon(editingBon.id, bonData);
      toast({
        title: "✅ Bon mis à jour",
        description: "Le bon a été mis à jour avec succès"
      });
      setEditingBon(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Erreur lors de la mise à jour du bon"
      });
    }
  };

  const handleDeleteBon = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bon ?')) {
      try {
        await onDeleteBon(id);
      toast({
        title: "✅ Bon supprimé",
        description: "Le bon a été supprimé avec succès"
      });
      } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Erreur lors de la suppression du bon"
      });
      }
    }
  };

  const getTypeBadge = (type: Bon['type']) => {
    const badgeConfig = {
      'gasoil': { className: 'bg-fuel text-fuel-foreground', label: 'Gasoil' },
      'essence': { className: 'bg-primary text-primary-foreground', label: 'Essence' },
      'gasoil_50': { className: 'bg-secondary text-secondary-foreground', label: 'Gasoil 50' }
    };
    
    const config = badgeConfig[type] || badgeConfig['gasoil'];
    return <Badge className={config.className}>{config.label}</Badge>;
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
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher numéro, notes..."
                  value={filters.search || ''}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Input
              type="date"
              placeholder="Date de début"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            />
            
            <Input
              type="date"
              placeholder="Date de fin"
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
              value={filters.chauffeurId || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, chauffeurId: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chauffeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous chauffeurs</SelectItem>
                {chauffeurs.map((chauffeur) => (
                  <SelectItem key={chauffeur.id} value={chauffeur.id}>
                    {chauffeur.prenom} {chauffeur.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.vehiculeId || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, vehiculeId: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Véhicule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous véhicules</SelectItem>
                {vehicules.map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id}>
                    {vehicule.immatriculation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => onFiltersChange({})}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {bons.length} bon(s) • Total: {statistics.totalMontant.toFixed(2)} TND
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
                  </div>

                  <div className="text-center">
                    <div className="font-semibold">{bon.montant.toFixed(2)} TND</div>
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
        bons={bons}
      />
    </div>
  );
};