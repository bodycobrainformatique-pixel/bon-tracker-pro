// Onglet de gestion des anomalies

import { useState } from 'react';
import { Anomalie, Bon, Chauffeur, Vehicule, AnomalieStatut } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAnomalieTypeLabel, getAnomalieGraviteColor } from '@/lib/anomaliesDetection';
import { Search, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AnomaliesTabProps {
  anomalies: Anomalie[];
  bons: Bon[];
  chauffeurs: Chauffeur[];
  vehicules: Vehicule[];
  onUpdateAnomalie: (id: string, updates: Partial<Anomalie>) => void;
}

export const AnomaliesTab = ({
  anomalies,
  bons,
  chauffeurs,
  vehicules,
  onUpdateAnomalie
}: AnomaliesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [graviteFilter, setGraviteFilter] = useState<string>('all');
  const [selectedAnomalie, setSelectedAnomalie] = useState<Anomalie | null>(null);
  const [commentaire, setCommentaire] = useState('');

  const handleUpdateStatut = (id: string, statut: AnomalieStatut, commentaires?: string) => {
    try {
      onUpdateAnomalie(id, { statut, commentaires });
      toast.success('Anomalie mise à jour avec succès');
      setSelectedAnomalie(null);
      setCommentaire('');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'anomalie');
    }
  };

  const filteredAnomalies = anomalies.filter(anomalie => {
    if (statutFilter !== 'all' && anomalie.statut !== statutFilter) return false;
    if (graviteFilter !== 'all' && anomalie.gravite !== graviteFilter) return false;
    
    if (searchTerm) {
      const bon = bons.find(b => b.id === anomalie.bonId);
      const chauffeur = bon ? chauffeurs.find(c => c.id === bon.chauffeurId) : null;
      const vehicule = bon ? vehicules.find(v => v.id === bon.vehiculeId) : null;
      
      const searchText = [
        bon?.numero || '',
        chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : '',
        vehicule ? vehicule.immatriculation : '',
        getAnomalieTypeLabel(anomalie.type),
        anomalie.details
      ].join(' ').toLowerCase();
      
      if (!searchText.includes(searchTerm.toLowerCase())) return false;
    }
    
    return true;
  });

  const getStatutBadge = (statut: AnomalieStatut) => {
    const styles = {
      a_verifier: 'bg-warning text-warning-foreground',
      en_cours: 'bg-info text-info-foreground',
      justifiee: 'bg-success text-success-foreground',
      fraude: 'bg-destructive text-destructive-foreground'
    };
    
    const labels = {
      a_verifier: 'À vérifier',
      en_cours: 'En cours',
      justifiee: 'Justifiée',
      fraude: 'Fraude'
    };

    return (
      <Badge className={styles[statut]}>
        {labels[statut]}
      </Badge>
    );
  };

  const getGraviteBadge = (gravite: Anomalie['gravite']) => {
    const labels = {
      faible: 'Faible',
      moyenne: 'Moyenne',
      elevee: 'Élevée',
      critique: 'Critique'
    };

    return (
      <Badge className={getAnomalieGraviteColor(gravite)}>
        {labels[gravite]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Gestion des Anomalies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="a_verifier">À vérifier</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="justifiee">Justifiée</SelectItem>
                <SelectItem value="fraude">Fraude</SelectItem>
              </SelectContent>
            </Select>

            <Select value={graviteFilter} onValueChange={setGraviteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Gravité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="elevee">Élevée</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredAnomalies.length} anomalie(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des anomalies */}
      <div className="grid gap-4">
        {filteredAnomalies.map((anomalie) => {
          const bon = bons.find(b => b.id === anomalie.bonId);
          const chauffeur = bon ? chauffeurs.find(c => c.id === bon.chauffeurId) : null;
          const vehicule = bon ? vehicules.find(v => v.id === bon.vehiculeId) : null;

          return (
            <Card key={anomalie.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-start">
                  <div className="md:col-span-2">
                    <div className="font-semibold">{getAnomalieTypeLabel(anomalie.type)}</div>
                    <div className="text-sm text-muted-foreground">
                      Score: {anomalie.scoreRisque}/100
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(anomalie.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    {getGraviteBadge(anomalie.gravite)}
                    {getStatutBadge(anomalie.statut)}
                  </div>

                  <div className="md:col-span-2 text-sm">
                    <div className="font-medium">
                      Bon: {bon?.numero || 'Inconnu'}
                    </div>
                    <div className="text-muted-foreground">
                      {chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'Chauffeur inconnu'}
                    </div>
                    <div className="text-muted-foreground">
                      {vehicule ? vehicule.immatriculation : 'Véhicule inconnu'}
                    </div>
                  </div>

                  <div className="md:col-span-2 text-sm">
                    <p className="line-clamp-2">{anomalie.details}</p>
                    {anomalie.commentaires && (
                      <p className="text-muted-foreground mt-1 line-clamp-1">
                        Commentaire: {anomalie.commentaires}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAnomalie(anomalie)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Détails</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAnomalies.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statutFilter !== 'all' || graviteFilter !== 'all' 
                  ? 'Aucune anomalie trouvée' 
                  : 'Aucune anomalie détectée'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de détails d'anomalie */}
      <Dialog open={!!selectedAnomalie} onOpenChange={() => setSelectedAnomalie(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'anomalie</DialogTitle>
          </DialogHeader>
          
          {selectedAnomalie && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p>{getAnomalieTypeLabel(selectedAnomalie.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Gravité</label>
                  <div className="mt-1">
                    {getGraviteBadge(selectedAnomalie.gravite)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Détails</label>
                <p className="mt-1 text-sm">{selectedAnomalie.details}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Statut actuel</label>
                <div className="mt-1">
                  {getStatutBadge(selectedAnomalie.statut)}
                </div>
              </div>

              {selectedAnomalie.commentaires && (
                <div>
                  <label className="text-sm font-medium">Commentaire</label>
                  <p className="mt-1 text-sm">{selectedAnomalie.commentaires}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Nouveau commentaire</label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatut(selectedAnomalie.id, 'justifiee', commentaire)}
                >
                  Marquer comme justifiée
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatut(selectedAnomalie.id, 'fraude', commentaire)}
                >
                  Signaler fraude
                </Button>
                <Button
                  onClick={() => handleUpdateStatut(selectedAnomalie.id, 'en_cours', commentaire)}
                >
                  Prendre en charge
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};