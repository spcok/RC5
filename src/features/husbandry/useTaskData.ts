import { useLiveQuery } from '@tanstack/react-db';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';

export const useTaskData = () => {
  const { data: tasks = [], isLoading } = useLiveQuery(tasksCollection);

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
    await tasksCollection.update({ id: taskId, completed: true });
    return { id: taskId, completed: true };
  };

  const deleteTask = async (taskId: string) => {
    await tasksCollection.update({ id: taskId, is_deleted: true });
  };

  return { 
    tasks: tasks.filter(t => !t.is_deleted), 
    isLoading, 
    addTask, 
    completeTask,
    deleteTask
  };
};
