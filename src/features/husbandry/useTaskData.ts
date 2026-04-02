import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import { db } from '../../lib/dexieDb';

export const useTaskData = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        if (data) await db.tasks.bulkPut(data);
        return data as Task[];
      } catch (err) {
        console.log('📡 Network offline. Reading Tasks from Dexie...', err);
        return await db.tasks.toArray();
      }
    },
    select: (data) => data.filter(t => !t.is_deleted)
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const task = {
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false,
        completed: false
      };
      try {
        const { data, error } = await supabase.from('tasks').insert([task]).select().single();
        if (error) throw error;
        await db.tasks.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving task locally...', err);
        await db.tasks.put(task as Task);
        return task as Task;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      try {
        const { data, error } = await supabase.from('tasks')
          .update({ completed: true })
          .eq('id', taskId).select().single();
        if (error) throw error;
        await db.tasks.update(taskId, { completed: true });
        return data;
      } catch (err) {
        console.log('📡 Network offline. Updating task locally...', err);
        await db.tasks.update(taskId, { completed: true });
        return { id: taskId, completed: true };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
        await db.tasks.delete(taskId);
      } catch (err) {
        console.log('📡 Network offline. Deleting task locally...', err);
        await db.tasks.delete(taskId);
      }
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
