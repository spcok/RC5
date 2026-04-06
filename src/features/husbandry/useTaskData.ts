import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

interface SupabaseTask {
  id: string;
  animal_id: string | null;
  title: string;
  notes: string | null;
  due_date: string | null;
  completed: boolean;
  type: string;
  recurring: boolean;
  assigned_to: string | null;
  updated_at: string;
  is_deleted: boolean;
}

export const useTaskData = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        
        const mappedData: Task[] = (data as unknown as SupabaseTask[]).map((item: SupabaseTask) => ({
          id: item.id,
          animalId: item.animal_id,
          title: item.title,
          notes: item.notes,
          dueDate: item.due_date,
          completed: item.completed,
          type: item.type,
          recurring: item.recurring,
          assignedTo: item.assigned_to,
          updatedAt: item.updated_at,
          isDeleted: item.is_deleted
        }));
        
        for (const item of mappedData) {
          try {
            await tasksCollection.update(item.id, () => item);
          } catch {
            await tasksCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving tasks from local vault.");
        return await tasksCollection.query().all();
      }
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const task: Task = {
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        dueDate: newTask.dueDate || new Date().toISOString(),
        completed: newTask.completed || false,
        isDeleted: false
      } as Task;

      const supabasePayload = {
        id: task.id,
        animal_id: task.animalId,
        title: task.title,
        notes: task.notes,
        due_date: task.dueDate,
        completed: task.completed,
        type: task.type,
        recurring: task.recurring,
        assigned_to: task.assignedTo,
        updated_at: task.updatedAt,
        is_deleted: task.isDeleted
      };

      try {
        const { error } = await supabase.from('tasks').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding task locally.");
      }
      await tasksCollection.insert(task);
      return task;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedTask = { ...task, completed: true };
      
      try {
        const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
        if (error) throw error;
      } catch {
        console.warn("Offline: Completing task locally.");
      }
      await tasksCollection.update(taskId, () => updatedTask);
      return updatedTask;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedTask = { ...task, isDeleted: true };
      
      try {
        const { error } = await supabase.from('tasks').update({ is_deleted: true }).eq('id', taskId);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting task locally.");
      }
      await tasksCollection.update(taskId, () => updatedTask);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  return { 
    tasks: tasks.filter(t => !t.isDeleted), 
    isLoading, 
    addTask: addTaskMutation.mutateAsync, 
    completeTask: completeTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync
  };
};
