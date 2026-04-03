import { useLiveQuery } from '@tanstack/react-db';
import { firstAidCollection } from '../../lib/database';
import { FirstAidLog } from '../../types';

export function useFirstAidData() {
  const { data: logs = [], isLoading } = useLiveQuery(firstAidCollection);

  const addFirstAid = async (log: Omit<FirstAidLog, 'id' | 'created_at'>) => {
    const payload = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    await firstAidCollection.insert(payload as FirstAidLog);
    return payload;
  };

  const deleteFirstAid = async (id: string) => {
    await firstAidCollection.update({ id, is_deleted: true });
  };

  return {
    logs: logs.filter(l => !l.is_deleted),
    isLoading,
    addFirstAid,
    deleteFirstAid
  };
}
