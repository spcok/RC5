import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incident_reports'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('incident_reports').select('*');
        if (error) throw error;
        if (data) await db.incidents.bulkPut(data);
        return (data || []) as Incident[];
      } catch (err) {
        console.log('📡 Network offline. Reading Incidents from Dexie...', err);
        return await db.incidents.toArray();
      }
    }
  });

  const addIncidentMutation = useMutation({
    mutationFn: async (incident: Omit<Incident, 'id' | 'created_at'>) => {
      const payload = {
        ...incident,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      try {
        const { data, error } = await supabase.from('incident_reports').insert([payload]).select().single();
        if (error) throw error;
        await db.incidents.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Incident locally...', err);
        await db.incidents.put(payload as Incident);
        return payload as Incident;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident_reports'] })
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('incident_reports').delete().eq('id', id);
        if (error) throw error;
        await db.incidents.delete(id);
      } catch (err) {
        console.log('📡 Network offline. Deleting Incident locally...', err);
        await db.incidents.delete(id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident_reports'] })
  });

  return {
    incidents,
    isLoading,
    addIncident: addIncidentMutation.mutateAsync,
    deleteIncident: deleteIncidentMutation.mutateAsync
  };
};
