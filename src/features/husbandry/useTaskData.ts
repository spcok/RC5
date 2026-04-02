import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';

export const useTaskData = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) throw error;
      return data as Task[];
    },
    select: (data) => data.filter(t => !t.is_deleted)
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const { data, error } = await supabase.from('tasks').insert([{
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false,
        completed: false
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase.from('tasks')
        .update({ completed: true })
        .eq('id', taskId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  return { 
    tasks, 
    isLoading, 
    addTask: addTaskMutation.mutateAsync, 
    completeTask: completeTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync
  };
};
