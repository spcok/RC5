import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['site_maintenance'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_maintenance')
          .select('*')
          .eq('is_deleted', false);
        if (error) throw error;
        if (data) await db.maintenance.bulkPut(data);
        return (data || []) as MaintenanceLog[];
      } catch (err) {
        console.log('📡 Network offline. Reading Maintenance Logs from Dexie...', err);
        return await db.maintenance.where('is_deleted').equals(false).toArray();
      }
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const payload = { ...newTask, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase.from('site_maintenance').insert([payload]).select().single();
        if (error) throw error;
        await db.maintenance.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Maintenance Log locally...', err);
        await db.maintenance.put(payload as MaintenanceLog);
        return payload as MaintenanceLog;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site_maintenance'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: MaintenanceLog) => {
      try {
        const { data, error } = await supabase.from('site_maintenance').update(task).eq('id', task.id).select().single();
        if (error) throw error;
        await db.maintenance.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Updating Maintenance Log locally...', err);
        await db.maintenance.put(task);
        return task;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site_maintenance'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('site_maintenance').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await db.maintenance.update(id, { is_deleted: true });
      } catch (err) {
        console.log('📡 Network offline. Deleting Maintenance Log locally...', err);
        await db.maintenance.update(id, { is_deleted: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site_maintenance'] })
  });

  return {
    logs,
    isLoading,
    addLog: addTaskMutation.mutateAsync,
    updateLog: updateTaskMutation.mutateAsync,
    deleteLog: deleteTaskMutation.mutateAsync
  };
};
