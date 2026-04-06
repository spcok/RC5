import { useLiveQuery } from '@tanstack/react-db';
import { incidentsCollection } from '../../lib/database';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const { data: incidents = [], isLoading } = useLiveQuery(incidentsCollection);

  const addIncident = async (incident: Omit<Incident, 'id' | 'created_at'>) => {
    const payload = {
      ...incident,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    await incidentsCollection.insert(payload as Incident);
    return payload;
  };

  const deleteIncident = async (id: string) => {
    const existing = incidents.find(i => i.id === id);
    if (existing) {
      await incidentsCollection.update({ ...existing, is_deleted: true });
    }
  };

  return {
    incidents,
    isLoading,
    addIncident,
    deleteIncident
  };
};
