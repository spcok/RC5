import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { FirstAidLog } from '../../types';

export function useFirstAidData() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['first_aid_logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('first_aid_logs').select('*');
        if (error) throw error;
        if (data) await db.first_aid.bulkPut(data);
        return (data || []) as FirstAidLog[];
      } catch (err) {
        console.log('📡 Network offline. Reading First Aid Logs from Dexie...', err);
        return await db.first_aid.toArray();
      }
    }
  });

  const addFirstAidMutation = useMutation({
    mutationFn: async (log: Omit<FirstAidLog, 'id' | 'created_at'>) => {
      const payload = {
        ...log,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      try {
        const { data, error } = await supabase.from('first_aid_logs').insert([payload]).select().single();
        if (error) throw error;
        await db.first_aid.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving First Aid Log locally...', err);
        await db.first_aid.put(payload as FirstAidLog);
        return payload as FirstAidLog;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['first_aid_logs'] })
  });

  const deleteFirstAidMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('first_aid_logs').delete().eq('id', id);
        if (error) throw error;
        await db.first_aid.delete(id);
      } catch (err) {
        console.log('📡 Network offline. Deleting First Aid Log locally...', err);
        await db.first_aid.delete(id);
      }
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
