import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  MaintenanceTask,
  MaintenancePlan,
  MaintenanceWorkOrder,
  MaintenanceEvent,
  Vendor,
  PartsCatalog,
  PartsUsage,
  MaintenanceKPIs,
  MaintenanceFilters
} from '@/types/maintenance';

export const useMaintenanceData = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parts, setParts] = useState<PartsCatalog[]>([]);
  const [partsUsage, setPartsUsage] = useState<PartsUsage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        tasksData,
        plansData,
        workOrdersData,
        eventsData,
        vendorsData,
        partsData,
        partsUsageData
      ] = await Promise.all([
        supabase.from('maintenance_tasks').select('*').order('libelle'),
        supabase.from('maintenance_plans').select(`
          *,
          vehicule:vehicules(id, immatriculation, marque, modele),
          task:maintenance_tasks(*)
        `).order('created_at', { ascending: false }),
        supabase.from('maintenance_work_orders').select(`
          *,
          vehicule:vehicules(id, immatriculation, marque, modele),
          task:maintenance_tasks(*),
          plan:maintenance_plans(*)
        `).order('created_at', { ascending: false }),
        supabase.from('maintenance_events').select(`
          *,
          work_order:maintenance_work_orders(*),
          vehicule:vehicules(id, immatriculation, marque, modele),
          task:maintenance_tasks(*)
        `).order('date_realisation', { ascending: false }),
        supabase.from('vendors').select('*').order('nom'),
        supabase.from('parts_catalog').select(`
          *,
          vendor:vendors(*)
        `).order('nom'),
        supabase.from('parts_usage').select(`
          *,
          part:parts_catalog(*)
        `).order('created_at', { ascending: false })
      ]);

      if (tasksData.error) throw tasksData.error;
      if (plansData.error) throw plansData.error;
      if (workOrdersData.error) throw workOrdersData.error;
      if (eventsData.error) throw eventsData.error;
      if (vendorsData.error) throw vendorsData.error;
      if (partsData.error) throw partsData.error;
      if (partsUsageData.error) throw partsUsageData.error;

      setTasks((tasksData.data || []).map(task => ({
        ...task,
        type: task.type as 'preventive' | 'corrective'
      })));
      setPlans((plansData.data || []).map(plan => ({
        ...plan,
        statut: plan.statut as 'actif' | 'suspendu',
        task: plan.task ? {
          ...plan.task,
          type: plan.task.type as 'preventive' | 'corrective'
        } : undefined
      })));
      setWorkOrders((workOrdersData.data || []).map(workOrder => ({
        ...workOrder,
        priorite: workOrder.priorite as 'basse' | 'moyenne' | 'haute',
        statut: workOrder.statut as 'ouvert' | 'en_cours' | 'termine' | 'annule',
        task: workOrder.task ? {
          ...workOrder.task,
          type: workOrder.task.type as 'preventive' | 'corrective'
        } : undefined,
        plan: workOrder.plan ? {
          ...workOrder.plan,
          statut: workOrder.plan.statut as 'actif' | 'suspendu'
        } : undefined
      })));
      setEvents((eventsData.data || []).map(event => ({
        ...event,
        task: event.task ? {
          ...event.task,
          type: event.task.type as 'preventive' | 'corrective'
        } : undefined,
        work_order: event.work_order ? {
          ...event.work_order,
          priorite: event.work_order.priorite as 'basse' | 'moyenne' | 'haute',
          statut: event.work_order.statut as 'ouvert' | 'en_cours' | 'termine' | 'annule'
        } : undefined
      })));
      setVendors(vendorsData.data || []);
      setParts(partsData.data || []);
      setPartsUsage(partsUsageData.data || []);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de maintenance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Real-time subscriptions
  useEffect(() => {
    loadInitialData();

    const channel = supabase
      .channel('maintenance-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'maintenance_tasks' }, 
        () => {
          console.log('🔄 Maintenance tasks changed');
          loadInitialData();
          queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'maintenance_plans' }, 
        () => {
          console.log('🔄 Maintenance plans changed');
          loadInitialData();
          queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'maintenance_work_orders' }, 
        () => {
          console.log('🔄 Maintenance work orders changed');
          loadInitialData();
          queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'maintenance_events' }, 
        () => {
          console.log('🔄 Maintenance events changed');
          loadInitialData();
          queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInitialData, queryClient]);

  // CRUD Operations
  const createTask = async (task: Omit<MaintenanceTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tâche de maintenance créée avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error creating maintenance task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche de maintenance",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createPlan = async (plan: any) => {
    try {
      // Only insert columns that exist in maintenance_plans table
      const planData = {
        vehicule_id: plan.vehicule_id,
        task_id: plan.task_id,
        start_date: plan.start_date,
        start_km: plan.start_km,
        statut: plan.statut
        // Note: interval_km and interval_jours are stored in maintenance_tasks, not maintenance_plans
      };

      const { data, error } = await supabase
        .from('maintenance_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Plan de maintenance créé avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error creating maintenance plan:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le plan de maintenance",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createWorkOrder = async (workOrder: Omit<MaintenanceWorkOrder, 'id' | 'created_at' | 'updated_at' | 'vehicule' | 'task' | 'plan'>) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_work_orders')
        .insert([workOrder])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ordre de travail créé avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'ordre de travail",
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeWorkOrder = async (
    workOrderId: string,
    event: Omit<MaintenanceEvent, 'id' | 'created_at' | 'updated_at' | 'work_order' | 'vehicule' | 'task' | 'cout_total'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .insert([{ ...event, work_order_id: workOrderId }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ordre de travail terminé avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error completing work order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer l'ordre de travail",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateWorkOrderStatus = async (id: string, statut: MaintenanceWorkOrder['statut']) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_work_orders')
        .update({ statut })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de l'ordre de travail mis à jour",
      });

      return data;
    } catch (error) {
      console.error('Error updating work order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Tasks CRUD
  const updateTask = async (id: string, taskData: any) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(task => task.id === id ? data as MaintenanceTask : task));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Tâche mise à jour avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Vendors CRUD
  const createVendor = async (vendorData: any) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();

      if (error) throw error;

      setVendors(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Prestataire créé avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le prestataire",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVendor = async (id: string, vendorData: any) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          ...vendorData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setVendors(prev => prev.map(vendor => vendor.id === id ? data : vendor));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Prestataire mis à jour avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prestataire",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVendors(prev => prev.filter(vendor => vendor.id !== id));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le prestataire",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Parts CRUD
  const createPart = async (partData: any) => {
    try {
      const { data, error } = await supabase
        .from('parts_catalog')
        .insert(partData)
        .select(`
          *,
          vendor:vendors(*)
        `)
        .single();

      if (error) throw error;

      setParts(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Pièce créée avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la pièce",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePart = async (id: string, partData: any) => {
    try {
      const { data, error } = await supabase
        .from('parts_catalog')
        .update({
          ...partData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          vendor:vendors(*)
        `)
        .single();

      if (error) throw error;

      setParts(prev => prev.map(part => part.id === id ? data : part));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Pièce mise à jour avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error updating part:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la pièce",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePart = async (id: string) => {
    try {
      const { error } = await supabase
        .from('parts_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setParts(prev => prev.filter(part => part.id !== id));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Pièce supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting part:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la pièce",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Plans CRUD  
  const updatePlan = async (id: string, planData: any) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_plans')
        .update({
          ...planData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          vehicule:vehicules(id, immatriculation, marque, modele),
          task:maintenance_tasks(*)
        `)
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(plan => plan.id === id ? data as MaintenancePlan : plan));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Plan mis à jour avec succès",
      });

      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le plan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== id));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Plan supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteWorkOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_work_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkOrders(prev => prev.filter(wo => wo.id !== id));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      
      toast({
        title: "Succès",
        description: "Ordre de travail supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting work order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ordre de travail",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Utility functions
  const getMaintenanceKPIs = useCallback((): MaintenanceKPIs => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const openWorkOrders = workOrders.filter(wo => wo.statut === 'ouvert' || wo.statut === 'en_cours');
    
    const overdueWorkOrders = workOrders.filter(wo => {
      if (wo.statut !== 'ouvert' && wo.statut !== 'en_cours') return false;
      
      const isDueDateOverdue = wo.due_date && new Date(wo.due_date) < now;
      // Note: We would need current odometer data to check km overdue
      
      return isDueDateOverdue;
    });

    const dueSoonWorkOrders = workOrders.filter(wo => {
      if (wo.statut !== 'ouvert' && wo.statut !== 'en_cours') return false;
      
      const isDueSoon = wo.due_date && 
        new Date(wo.due_date) >= now && 
        new Date(wo.due_date) <= sevenDaysFromNow;
      
      return isDueSoon;
    });

    const lastMonthEvents = events.filter(event => {
      const eventDate = new Date(event.date_realisation);
      return eventDate >= lastMonth && eventDate < firstDayOfMonth;
    });

    const thisYearEvents = events.filter(event => {
      const eventDate = new Date(event.date_realisation);
      return eventDate >= firstDayOfYear;
    });

    return {
      ouverts: openWorkOrders.length,
      en_retard: overdueWorkOrders.length,
      a_venir_7j: dueSoonWorkOrders.length,
      a_venir_500km: 0, // Would need odometer data
      cout_mois_precedent: lastMonthEvents.reduce((sum, event) => sum + (event.cout_total || 0), 0),
      cout_annee_courante: thisYearEvents.reduce((sum, event) => sum + (event.cout_total || 0), 0)
    };
  }, [workOrders, events]);

  const getFilteredWorkOrders = useCallback((filters: MaintenanceFilters): MaintenanceWorkOrder[] => {
    return workOrders.filter(workOrder => {
      if (filters.vehicule_id && filters.vehicule_id !== 'all' && workOrder.vehicule_id !== filters.vehicule_id) return false;
      if (filters.priorite && filters.priorite !== 'all' && workOrder.priorite !== filters.priorite) return false;
      if (filters.statut && filters.statut !== 'all' && workOrder.statut !== filters.statut) return false;
      if (filters.assigned_to && filters.assigned_to !== 'all' && !workOrder.assigned_to?.includes(filters.assigned_to)) return false;
      if (filters.date_from && workOrder.due_date && workOrder.due_date < filters.date_from) return false;
      if (filters.date_to && workOrder.due_date && workOrder.due_date > filters.date_to) return false;
      
      return true;
    });
  }, [workOrders]);

  return {
    // Data
    tasks,
    plans,
    workOrders,
    events,
    vendors,
    parts,
    partsUsage,
    loading,
    
    // CRUD operations
    createTask,
    updateTask,
    deleteTask,
    createVendor,
    updateVendor,
    deleteVendor,
    createPart,
    updatePart,
    deletePart,
    createPlan,
    updatePlan,
    deletePlan,
    createWorkOrder,
    deleteWorkOrder,
    completeWorkOrder,
    updateWorkOrderStatus,
    
    // Utilities
    getMaintenanceKPIs,
    getFilteredWorkOrders,
    
    // Refresh function
    refresh: loadInitialData
  };
};