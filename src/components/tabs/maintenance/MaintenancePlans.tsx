import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus,
  Calendar as CalendarIcon,
  RefreshCw,
  Settings,
  Wrench,
  MapPin
} from 'lucide-react';
import { Vehicule } from '@/types';
import { MaintenancePlan, MaintenanceTask } from '@/types/maintenance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MaintenancePlansProps {
  plans: MaintenancePlan[];
  tasks: MaintenanceTask[];
  vehicules: Vehicule[];
  createPlan: (plan: any) => Promise<any>;
}

export const MaintenancePlans = ({ 
  plans, 
  tasks,
  vehicules,
  createPlan
}: MaintenancePlansProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState<{
    vehicule_id: string;
    task_id: string;
    start_date: Date;
    start_km: string;
    interval_km: string;
    interval_jours: string;
    statut: 'actif' | 'suspendu';
  }>({
    vehicule_id: '',
    task_id: '',
    start_date: new Date(),
    start_km: '',
    interval_km: '',
    interval_jours: '',
    statut: 'actif'
  });

  // Maintenance categories
  const maintenanceCategories = {
    'maintenance_reguliere': {
      label: 'Maintenance régulière (préventive)',
      prefixes: ['VID', 'FIL', 'FLU', 'BOU', 'ECH', 'COU', 'ECL']
    },
    'pneumatiques': {
      label: 'Pneumatiques',
      prefixes: ['PNE']
    },
    'freins': {
      label: 'Freins',
      prefixes: ['FRE']
    },
    'suspension_direction': {
      label: 'Suspension et direction',
      prefixes: ['SUS', 'DIR']
    },
    'batterie_electricite': {
      label: 'Batterie et électricité',
      prefixes: ['BAT', 'ELE']
    },
    'climatisation': {
      label: 'Climatisation et chauffage',
      prefixes: ['CLI']
    },
    'transmission': {
      label: 'Transmission et embrayage',
      prefixes: ['TRA', 'EMB']
    },
    'controles_periodiques': {
      label: 'Contrôles périodiques spécifiques',
      prefixes: ['ANT', 'CHA', 'PAR', 'ACC']
    },
    'nettoyage': {
      label: 'Nettoyage et entretien esthétique',
      prefixes: ['NET']
    },
    'administratif': {
      label: 'Maintenance administrative',
      prefixes: ['ADM']
    }
  };

  // Filter tasks based on selected category
  const getFilteredTasks = () => {
    if (!selectedCategory) return [];
    
    const category = maintenanceCategories[selectedCategory as keyof typeof maintenanceCategories];
    if (!category) return [];
    
    return tasks.filter(task => 
      task.actif && 
      category.prefixes.some(prefix => task.code.startsWith(prefix))
    );
  };

  const handleCreatePlan = async () => {
    try {
      const selectedTask = tasks.find(t => t.id === formData.task_id);
      
      await createPlan({
        vehicule_id: formData.vehicule_id,
        task_id: formData.task_id,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        start_km: parseInt(formData.start_km) || 0,
        statut: formData.statut,
        // Use task defaults or form overrides
        interval_km: formData.interval_km ? parseInt(formData.interval_km) : selectedTask?.interval_km,
        interval_jours: formData.interval_jours ? parseInt(formData.interval_jours) : selectedTask?.interval_jours
      });

      setShowCreateDialog(false);
      setSelectedCategory('');
      setFormData({
        vehicule_id: '',
        task_id: '',
        start_date: new Date(),
        start_km: '',
        interval_km: '',
        interval_jours: '',
        statut: 'actif'
      });
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'default';
      case 'suspendu': return 'secondary';
      default: return 'default';
    }
  };

  const isOverdue = (plan: MaintenancePlan) => {
    const now = new Date();
    if (plan.next_due_date && new Date(plan.next_due_date) < now) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plans de maintenance</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les plans de maintenance préventive par véhicule
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculer échéances
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer un plan de maintenance</DialogTitle>
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
                  <Label htmlFor="category">Catégorie de maintenance</Label>
                  <Select value={selectedCategory} onValueChange={(value) => {
                    setSelectedCategory(value);
                    // Reset task selection when category changes
                    setFormData(prev => ({ 
                      ...prev, 
                      task_id: '',
                      interval_km: '',
                      interval_jours: ''
                    }));
                  }}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      {Object.entries(maintenanceCategories).map(([key, category]) => (
                        <SelectItem key={key} value={key} className="hover:bg-accent">
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="task">Tâche de maintenance</Label>
                  <Select 
                    value={formData.task_id} 
                    onValueChange={(value) => {
                      const selectedTask = getFilteredTasks().find(t => t.id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        task_id: value,
                        interval_km: selectedTask?.interval_km?.toString() || '',
                        interval_jours: selectedTask?.interval_jours?.toString() || ''
                      }));
                    }}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={!selectedCategory ? "Sélectionner d'abord une catégorie" : "Sélectionner une tâche"} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      {getFilteredTasks().map((task) => (
                        <SelectItem key={task.id} value={task.id} className="hover:bg-accent">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{task.libelle}</span>
                            <span className="text-xs text-muted-foreground">({task.code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "dd/MM/yyyy", { locale: fr }) : "Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="start_km">Km de début</Label>
                    <Input
                      id="start_km"
                      type="number"
                      value={formData.start_km}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_km: e.target.value }))}
                      placeholder="Ex: 50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interval_km">Intervalle (km)</Label>
                    <Input
                      id="interval_km"
                      type="number"
                      value={formData.interval_km}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_km: e.target.value }))}
                      placeholder="Ex: 10000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interval_jours">Intervalle (jours)</Label>
                    <Input
                      id="interval_jours"
                      type="number"
                      value={formData.interval_jours}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_jours: e.target.value }))}
                      placeholder="Ex: 365"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={formData.statut} onValueChange={(value: 'actif' | 'suspendu') => 
                    setFormData(prev => ({ ...prev, statut: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreatePlan}
                    disabled={!formData.vehicule_id || !formData.task_id || !formData.start_km}
                  >
                    Créer le plan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        {plans.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Intervalle</TableHead>
                <TableHead>Dernière réalisation</TableHead>
                <TableHead>Prochaine échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className={isOverdue(plan) ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{plan.vehicule?.immatriculation}</div>
                      <div className="text-sm text-muted-foreground">
                        {plan.vehicule?.marque} {plan.vehicule?.modele}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{plan.task?.libelle}</div>
                      <div className="text-sm text-muted-foreground">
                        {plan.task?.code} • {plan.task?.type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {plan.task?.interval_km && (
                        <div className="text-sm">
                          🛣️ {plan.task.interval_km.toLocaleString()} km
                        </div>
                      )}
                      {plan.task?.interval_jours && (
                        <div className="text-sm">
                          📅 {plan.task.interval_jours} jours
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {plan.last_done_date && (
                        <div className="text-sm">
                          📅 {format(new Date(plan.last_done_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      )}
                      {plan.last_done_km && (
                        <div className="text-sm text-muted-foreground">
                          🛣️ {plan.last_done_km.toLocaleString()} km
                        </div>
                      )}
                      {!plan.last_done_date && !plan.last_done_km && (
                        <span className="text-sm text-muted-foreground">Jamais réalisé</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {plan.next_due_date && (
                        <div className={cn(
                          "text-sm",
                          isOverdue(plan) ? "text-red-600 font-medium" : ""
                        )}>
                          📅 {format(new Date(plan.next_due_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      )}
                      {plan.next_due_km && (
                        <div className="text-sm text-muted-foreground">
                          🛣️ {plan.next_due_km.toLocaleString()} km
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatutColor(plan.statut)}>
                      {plan.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline">
                        <Wrench className="h-4 w-4 mr-1" />
                        Effectuer maintenant
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Aucun plan de maintenance configuré</p>
            <p className="text-sm">Créez votre premier plan pour commencer</p>
          </div>
        )}
      </Card>
    </div>
  );
};