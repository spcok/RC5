import { useLiveQuery } from '@tanstack/react-db';
import { maintenanceCollection } from '../../lib/database';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const { data: logs = [], isLoading } = useLiveQuery(maintenanceCollection);

  const addLog = async (newTask: Omit<MaintenanceLog, 'id'>) => {
    const payload = { ...newTask, id: crypto.randomUUID() };
    await maintenanceCollection.insert(payload as MaintenanceLog);
    return payload;
  };

  const updateLog = async (task: MaintenanceLog) => {
    await maintenanceCollection.update(task);
    return task;
  };

  const deleteLog = async (id: string) => {
    await maintenanceCollection.update({ id, is_deleted: true });
  };

  return {
    logs: logs.filter(l => !l.is_deleted),
    isLoading,
    addLog,
    updateLog,
    deleteLog
  };
};
