import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Settings,
  Edit,
  Trash2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { MaintenanceTask } from '@/types/maintenance';

interface MaintenanceSettingsProps {
  tasks: MaintenanceTask[];
  createTask: (task: any) => Promise<any>;
}

export const MaintenanceSettings = ({ tasks, createTask }: MaintenanceSettingsProps) => {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    libelle: string;
    type: 'preventive' | 'corrective';
    interval_km: string;
    interval_jours: string;
    duree_estimee_min: string;
    pieces_defaut: string;
    actif: boolean;
  }>({
    code: '',
    libelle: '',
    type: 'preventive',
    interval_km: '',
    interval_jours: '',
    duree_estimee_min: '',
    pieces_defaut: '',
    actif: true
  });

  const handleCreateTask = async () => {
    try {
      await createTask({
        code: formData.code,
        libelle: formData.libelle,
        type: formData.type,
        interval_km: formData.interval_km ? parseInt(formData.interval_km) : undefined,
        interval_jours: formData.interval_jours ? parseInt(formData.interval_jours) : undefined,
        duree_estimee_min: formData.duree_estimee_min ? parseInt(formData.duree_estimee_min) : undefined,
        pieces_defaut: formData.pieces_defaut ? JSON.parse(formData.pieces_defaut) : undefined,
        actif: formData.actif
      });

      setShowTaskDialog(false);
      setFormData({
        code: '',
        libelle: '',
        type: 'preventive',
        interval_km: '',
        interval_jours: '',
        duree_estimee_min: '',
        pieces_defaut: '',
        actif: true
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive': return 'default';
      case 'corrective': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Paramètres de maintenance</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les tâches de maintenance et les seuils d'alerte
        </p>
      </div>

      {/* Configuration Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h4 className="font-medium">Seuils d'alerte</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="seuil_jours">Maintenance due dans (jours)</Label>
                <Input
                  id="seuil_jours"
                  type="number"
                  defaultValue="7"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alerter quand une maintenance est due dans X jours
                </p>
              </div>

              <div>
                <Label htmlFor="seuil_km">Maintenance due dans (km)</Label>
                <Input
                  id="seuil_km"
                  type="number"
                  defaultValue="500"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alerter quand une maintenance est due dans X kilomètres
                </p>
              </div>
            </div>

            <Button className="w-full">
              Sauvegarder les seuils
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Paramètres généraux</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications par email</Label>
                  <p className="text-xs text-muted-foreground">
                    Envoyer des notifications pour les maintenances dues
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-génération des OT</Label>
                  <p className="text-xs text-muted-foreground">
                    Créer automatiquement les ordres de travail
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Contrôle kilométrage</Label>
                  <p className="text-xs text-muted-foreground">
                    Vérifier la cohérence du kilométrage
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium">Tâches de maintenance</h4>
            <p className="text-sm text-muted-foreground">
              Modèles de tâches utilisés pour créer les plans de maintenance
            </p>
          </div>

          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer une tâche de maintenance</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: VID001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'preventive' | 'corrective') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Préventive</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="libelle">Libellé</Label>
                  <Input
                    id="libelle"
                    value={formData.libelle}
                    onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                    placeholder="Ex: Vidange moteur et filtre à huile"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="interval_km">Intervalle (km)</Label>
                    <Input
                      id="interval_km"
                      type="number"
                      value={formData.interval_km}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_km: e.target.value }))}
                      placeholder="10000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interval_jours">Intervalle (jours)</Label>
                    <Input
                      id="interval_jours"
                      type="number"
                      value={formData.interval_jours}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_jours: e.target.value }))}
                      placeholder="365"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duree">Durée (min)</Label>
                    <Input
                      id="duree"
                      type="number"
                      value={formData.duree_estimee_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, duree_estimee_min: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pieces">Pièces par défaut (JSON)</Label>
                  <Textarea
                    id="pieces"
                    value={formData.pieces_defaut}
                    onChange={(e) => setFormData(prev => ({ ...prev, pieces_defaut: e.target.value }))}
                    placeholder='{"huile": "5L", "filtre": "1 pièce"}'
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format JSON optionnel pour les pièces couramment utilisées
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="actif" 
                    checked={formData.actif}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
                  />
                  <Label htmlFor="actif">Tâche active</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateTask}
                    disabled={!formData.code || !formData.libelle}
                  >
                    Créer la tâche
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          {tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Intervalles</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-sm">
                      {task.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {task.libelle}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(task.type)}>
                        {task.type === 'preventive' ? 'Préventive' : 'Corrective'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {task.interval_km && (
                          <div className="text-sm">🛣️ {task.interval_km.toLocaleString()} km</div>
                        )}
                        {task.interval_jours && (
                          <div className="text-sm">📅 {task.interval_jours} jours</div>
                        )}
                        {!task.interval_km && !task.interval_jours && (
                          <span className="text-sm text-muted-foreground">Manuel</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.duree_estimee_min ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{task.duree_estimee_min} min</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.actif ? 'default' : 'secondary'}>
                        {task.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Aucune tâche de maintenance configurée</p>
              <p className="text-sm">Créez vos premières tâches pour commencer</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};