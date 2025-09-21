import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus,
  Calendar as CalendarIcon,
  Play,
  CheckCircle,
  Eye,
  Edit,
  FileText,
  Wrench
} from 'lucide-react';
import { Vehicule } from '@/types';
import { MaintenanceFilters, MaintenanceWorkOrder, MaintenanceTask, PartsCatalog } from '@/types/maintenance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MaintenanceWorkOrdersProps {
  workOrders: MaintenanceWorkOrder[];
  tasks: MaintenanceTask[];
  vehicules: Vehicule[];
  parts: PartsCatalog[];
  getFilteredWorkOrders: (filters: MaintenanceFilters) => MaintenanceWorkOrder[];
  createWorkOrder: (workOrderData: any) => Promise<any>;
  updateWorkOrderStatus: (id: string, statut: string) => Promise<any>;
  completeWorkOrder: (eventData: any) => Promise<any>;
  deleteWorkOrder: (id: string) => Promise<void>;
}

export const MaintenanceWorkOrders = ({ 
  workOrders,
  tasks,
  vehicules,
  parts,
  getFilteredWorkOrders,
  createWorkOrder,
  updateWorkOrderStatus,
  completeWorkOrder,
  deleteWorkOrder
}: MaintenanceWorkOrdersProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<MaintenanceFilters>({
    vehicule_id: 'all',
    priorite: 'all',
    statut: 'all'
  });
  const [formData, setFormData] = useState<{
    vehicule_id: string;
    task_id: string;
    due_date: Date | undefined;
    due_km: string;
    priorite: 'basse' | 'moyenne' | 'haute';
    assigned_to: string;
    notes: string;
  }>({
    vehicule_id: '',
    task_id: '',
    due_date: undefined,
    due_km: '',
    priorite: 'moyenne',
    assigned_to: '',
    notes: ''
  });

  const filteredWorkOrders = getFilteredWorkOrders(filters);

  const handleCreateWorkOrder = async () => {
    try {
      await createWorkOrder({
        vehicule_id: formData.vehicule_id,
        task_id: formData.task_id,
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : undefined,
        due_km: formData.due_km ? parseInt(formData.due_km) : undefined,
        priorite: formData.priorite,
        assigned_to: formData.assigned_to || undefined,
        notes: formData.notes || undefined
      });

      setShowCreateDialog(false);
      setFormData({
        vehicule_id: '',
        task_id: '',
        due_date: undefined,
        due_km: '',
        priorite: 'moyenne',
        assigned_to: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating work order:', error);
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'destructive';
      case 'moyenne': return 'default';
      case 'basse': return 'secondary';
      default: return 'default';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'ouvert': return 'default';
      case 'en_cours': return 'secondary';
      case 'termine': return 'default'; // Use 'default' instead of 'success'
      case 'annule': return 'destructive';
      default: return 'default';
    }
  };

  const handleUpdateStatus = async (workOrderId: string, newStatut: MaintenanceWorkOrder['statut']) => {
    try {
      await updateWorkOrderStatus(workOrderId, newStatut);
    } catch (error) {
      console.error('Error updating work order status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ordres de travail</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les ordres de travail de maintenance
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer OT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un ordre de travail</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="vehicule">Véhicule</Label>
                <Select value={formData.vehicule_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, vehicule_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicules.map((vehicule) => (
                      <SelectItem key={vehicule.id} value={vehicule.id}>
                        {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="task">Tâche de maintenance</Label>
                <Select value={formData.task_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, task_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une tâche" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.filter(t => t.actif).map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.libelle} ({task.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date">Échéance date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "dd/MM/yyyy", { locale: fr }) : "Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="due_km">Échéance km</Label>
                  <Input
                    id="due_km"
                    type="number"
                    value={formData.due_km}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_km: e.target.value }))}
                    placeholder="Ex: 60000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priorite">Priorité</Label>
                <Select value={formData.priorite} onValueChange={(value: 'basse' | 'moyenne' | 'haute') => 
                  setFormData(prev => ({ ...prev, priorite: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigné à</Label>
                <Input
                  id="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  placeholder="Nom du technicien ou prestataire"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Instructions spéciales, observations..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateWorkOrder}
                  disabled={!formData.vehicule_id || !formData.task_id}
                >
                  Créer l'OT
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={filters.vehicule_id || ''} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, vehicule_id: value || undefined }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Tous les véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les véhicules</SelectItem>
                {vehicules.map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id}>
                    {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <Select value={filters.statut || ''} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, statut: value || undefined }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="ouvert">Ouvert</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <Select value={filters.priorite || ''} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, priorite: value || undefined }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Toutes priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Work Orders Table */}
      <Card>
        {filteredWorkOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OT#</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
                  <TableCell className="font-mono text-sm">
                    {workOrder.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{workOrder.vehicule?.immatriculation}</div>
                      <div className="text-sm text-muted-foreground">
                        {workOrder.vehicule?.marque} {workOrder.vehicule?.modele}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{workOrder.task?.libelle}</div>
                      <div className="text-sm text-muted-foreground">
                        {workOrder.task?.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {workOrder.due_date && (
                        <div className="text-sm">
                          📅 {format(new Date(workOrder.due_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      )}
                      {workOrder.due_km && (
                        <div className="text-sm text-muted-foreground">
                          🛣️ {workOrder.due_km.toLocaleString()} km
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(workOrder.priorite)}>
                      {workOrder.priorite}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatutColor(workOrder.statut)}>
                      {workOrder.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {workOrder.assigned_to || (
                      <span className="text-muted-foreground">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {workOrder.statut === 'ouvert' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateStatus(workOrder.id, 'en_cours')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Démarrer
                        </Button>
                      )}
                      
                      {workOrder.statut === 'en_cours' && (
                        <Button
                          size="sm"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Terminer
                        </Button>
                      )}

                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>

                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Aucun ordre de travail trouvé</p>
            <p className="text-sm">Les ordres de travail s'afficheront ici</p>
          </div>
        )}
      </Card>
    </div>
  );
};