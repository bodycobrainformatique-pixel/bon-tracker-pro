import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  Play,
  CheckCircle,
  Eye,
  Phone,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Vehicule } from '@/types';
import { MaintenanceWorkOrder, MaintenanceKPIs, MaintenanceFilters } from '@/types/maintenance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MaintenanceDashboardProps {
  workOrders: MaintenanceWorkOrder[];
  getMaintenanceKPIs: () => MaintenanceKPIs;
  getFilteredWorkOrders: (filters: MaintenanceFilters) => MaintenanceWorkOrder[];
  updateWorkOrderStatus: (id: string, statut: MaintenanceWorkOrder['statut']) => Promise<any>;
  vehicules: Vehicule[];
}

export const MaintenanceDashboard = ({ 
  workOrders, 
  getMaintenanceKPIs,
  getFilteredWorkOrders,
  updateWorkOrderStatus,
  vehicules 
}: MaintenanceDashboardProps) => {
  const [filters, setFilters] = useState<MaintenanceFilters>({});
  const kpis = getMaintenanceKPIs();
  const filteredWorkOrders = getFilteredWorkOrders(filters);
  
  // Sort work orders by priority and due date
  const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => {
    const priorityOrder = { 'haute': 3, 'moyenne': 2, 'basse': 1 };
    const aPriority = priorityOrder[a.priorite];
    const bPriority = priorityOrder[b.priorite];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    
    return 0;
  });

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

  const handleStartWorkOrder = async (workOrderId: string) => {
    try {
      await updateWorkOrderStatus(workOrderId, 'en_cours');
    } catch (error) {
      console.error('Error starting work order:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-md p-2">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maintenance due</p>
              <p className="text-2xl font-bold text-blue-600">{kpis.ouverts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 rounded-md p-2">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En retard</p>
              <p className="text-2xl font-bold text-red-600">{kpis.en_retard}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 rounded-md p-2">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">À venir (7j)</p>
              <p className="text-2xl font-bold text-yellow-600">{kpis.a_venir_7j}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 rounded-md p-2">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Coût YTD</p>
              <p className="text-2xl font-bold text-green-600">
                {kpis.cout_annee_courante.toFixed(0)} TND
              </p>
            </div>
          </div>
        </Card>
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
                <SelectItem value="">Tous les véhicules</SelectItem>
                {vehicules.map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id}>
                    {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                  </SelectItem>
                ))}
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
                <SelectItem value="">Toutes priorités</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
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
                <SelectItem value="">Tous statuts</SelectItem>
                <SelectItem value="ouvert">Ouvert</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[200px]">
            <Input 
              placeholder="Assigné à..." 
              value={filters.assigned_to || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, assigned_to: e.target.value || undefined }))}
            />
          </div>
        </div>
      </Card>

      {/* Work Orders List */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Ordres de travail à traiter</h3>
            </div>
            <Badge variant="outline">
              {sortedWorkOrders.length} ordre(s)
            </Badge>
          </div>
        </div>

        {sortedWorkOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
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
              {sortedWorkOrders.map((workOrder) => (
                <TableRow key={workOrder.id}>
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
                          onClick={() => handleStartWorkOrder(workOrder.id)}
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
                        Voir
                      </Button>

                      {workOrder.assigned_to && (
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun ordre de travail avec les filtres appliqués</p>
          </div>
        )}
      </Card>
    </div>
  );
};