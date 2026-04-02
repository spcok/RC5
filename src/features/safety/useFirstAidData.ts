import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { FirstAidLog } from '../../types';

export function useFirstAidData() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['first_aid_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('first_aid_logs').select('*');
      if (error) throw error;
      return (data || []).map(l => ({
        id: l.id,
        date: l.date,
        staff_id: l.staff_id,
        incident_description: l.incident_description,
        treatment_provided: l.treatment_provided,
        created_at: l.created_at,
        person_name: l.person_name,
        type: l.type,
        location: l.location,
        outcome: l.outcome
      })) as FirstAidLog[];
    }
  });

  const addFirstAidMutation = useMutation({
    mutationFn: async (log: Omit<FirstAidLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('first_aid_logs').insert([{
        date: log.date,
        staff_id: log.staff_id,
        incident_description: log.incident_description,
        treatment_provided: log.treatment_provided,
        person_name: log.person_name,
        type: log.type,
        location: log.location,
        outcome: log.outcome
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['first_aid_logs'] })
  });

  const deleteFirstAidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('first_aid_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['first_aid_logs'] })
  });

  return {
    logs,
    isLoading,
    addFirstAid: addFirstAidMutation.mutateAsync,
    deleteFirstAid: deleteFirstAidMutation.mutateAsync
  };
}
