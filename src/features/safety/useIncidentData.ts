import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incident_reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('incident_reports').select('*');
      if (error) throw error;
      return (data || []).map(i => ({
        id: i.id,
        description: i.description,
        severity: i.severity,
        date: i.date,
        time: i.time,
        type: i.type,
        location: i.location,
        status: i.status,
        reported_by: i.reported_by,
        reporter_id: i.reporter_id,
        created_at: i.created_at
      })) as Incident[];
    }
  });

  const addIncidentMutation = useMutation({
    mutationFn: async (incident: Omit<Incident, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('incident_reports').insert([{
        description: incident.description,
        severity: incident.severity,
        date: incident.date,
        time: incident.time,
        type: incident.type,
        location: incident.location,
        status: incident.status,
        reported_by: incident.reported_by,
        reporter_id: incident.reporter_id
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident_reports'] })
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incident_reports').delete().eq('id', id);
      if (error) throw error;
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
