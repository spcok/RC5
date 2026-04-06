import { useQuery } from '@tanstack/react-query';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';

export const useTaskData = () => {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => await tasksCollection.query().all()
  });

  const addTask = async (newTask: Partial<Task>) => {
    const task = {
      ...newTask,
      id: newTask.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      completed: false
    };
    await tasksCollection.insert(task as Task);
    return task;
  };

  const completeTask = async (taskId: string) => {
    const existing = tasks.find(t => t.id === taskId);
    if (existing) {
      await tasksCollection.update({ ...existing, completed: true });
      return { id: taskId, completed: true };
    }
  };

  const deleteTask = async (taskId: string) => {
    const existing = tasks.find(t => t.id === taskId);
    if (existing) {
      await tasksCollection.update({ ...existing, is_deleted: true });
    }
  };

  return { 
    tasks: tasks.filter(t => !t.is_deleted), 
    isLoading, 
    addTask, 
    completeTask,
    deleteTask
  };
};
