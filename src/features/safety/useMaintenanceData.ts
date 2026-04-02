import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['site_maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_maintenance')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw error;
      return (data || []) as MaintenanceLog[];
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const { data, error } = await supabase.from('site_maintenance').insert([newTask]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site_maintenance'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: MaintenanceLog) => {
      const { data, error } = await supabase.from('site_maintenance').update(task).eq('id', task.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['site_maintenance'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_maintenance').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
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
