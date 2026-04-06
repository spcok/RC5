import { useLiveQuery } from '@tanstack/react-db';
import { safetyDrillsCollection } from '../../lib/database';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const { data: drills = [], isLoading } = useLiveQuery(safetyDrillsCollection);

  const addDrillLog = async (newDrill: Omit<SafetyDrill, 'id'>) => {
    const payload = { ...newDrill, id: crypto.randomUUID() };
    await safetyDrillsCollection.insert(payload as SafetyDrill);
    return payload;
  };

  const deleteDrillLog = async (id: string) => {
    const existing = drills.find(d => d.id === id);
    if (existing) {
      await safetyDrillsCollection.update({ ...existing, is_deleted: true });
    }
  };

  return {
    drills: drills.filter(d => !d.is_deleted),
    isLoading,
    addDrillLog,
    deleteDrillLog
  };
};
