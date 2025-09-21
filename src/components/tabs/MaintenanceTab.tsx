import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaintenanceDashboard } from './maintenance/MaintenanceDashboard';
import { MaintenancePlans } from './maintenance/MaintenancePlans';
import { MaintenanceWorkOrders } from './maintenance/MaintenanceWorkOrders';
import { MaintenanceHistory } from './maintenance/MaintenanceHistory';
import { MaintenanceParts } from './maintenance/MaintenanceParts';
import { MaintenanceSettings } from './maintenance/MaintenanceSettings';
import { useMaintenanceData } from '@/hooks/useMaintenanceData';
import { Vehicule, Chauffeur } from '@/types';

interface MaintenanceTabProps {
  vehicules: Vehicule[];
  chauffeurs: Chauffeur[];
}

export const MaintenanceTab = ({ vehicules, chauffeurs }: MaintenanceTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const maintenanceData = useMaintenanceData();

  if (maintenanceData.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données de maintenance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Maintenance des Véhicules</h2>
          <p className="text-muted-foreground">
            Gestion des plans de maintenance et ordres de travail
          </p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="work-orders">Ordres de travail</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="parts">Pièces & Prestataires</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <MaintenanceDashboard 
            {...maintenanceData}
            vehicules={vehicules}
          />
        </TabsContent>

        <TabsContent value="plans">
          <MaintenancePlans 
            {...maintenanceData}
            vehicules={vehicules}
          />
        </TabsContent>

        <TabsContent value="work-orders">
          <MaintenanceWorkOrders 
            workOrders={maintenanceData.workOrders}
            tasks={maintenanceData.tasks}
            vehicules={vehicules}
            parts={maintenanceData.parts}
            getFilteredWorkOrders={maintenanceData.getFilteredWorkOrders}
            createWorkOrder={maintenanceData.createWorkOrder}
            updateWorkOrderStatus={maintenanceData.updateWorkOrderStatus}
            completeWorkOrder={(eventData) => maintenanceData.completeWorkOrder(eventData.work_order_id, eventData)}
            deleteWorkOrder={maintenanceData.deleteWorkOrder}
          />
        </TabsContent>

        <TabsContent value="history">
          <MaintenanceHistory 
            {...maintenanceData}
            vehicules={vehicules}
          />
        </TabsContent>

        <TabsContent value="parts">
          <MaintenanceParts 
            vendors={maintenanceData.vendors}
            parts={maintenanceData.parts}
            createVendor={maintenanceData.createVendor}
            updateVendor={maintenanceData.updateVendor}
            deleteVendor={maintenanceData.deleteVendor}
            createPart={maintenanceData.createPart}
            updatePart={maintenanceData.updatePart}
            deletePart={maintenanceData.deletePart}
          />
        </TabsContent>

        <TabsContent value="settings">
          <MaintenanceSettings 
            {...maintenanceData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};