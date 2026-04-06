import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firstAidCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { FirstAidLog } from '../../types';

export function useFirstAidData() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery<FirstAidLog[]>({
    queryKey: ['firstAid'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('first_aid').select('*');
        if (error) throw error;
        data.forEach(item => firstAidCollection.update(item.id, () => item as FirstAidLog).catch(() => firstAidCollection.insert(item as FirstAidLog)));
        return data as FirstAidLog[];
      } catch {
        console.warn("Network unreachable. Serving First Aid logs from local vault.");
        return await firstAidCollection.getAll();
      }
    }
  });

  const addFirstAidMutation = useMutation({
    mutationFn: async (log: Omit<FirstAidLog, 'id' | 'created_at'>) => {
      const payload: FirstAidLog = {
        ...log,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      } as FirstAidLog;
      try {
        const { error } = await supabase.from('first_aid').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding first aid log locally.");
      }
      await firstAidCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['firstAid'] })
  });

  const deleteFirstAidMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('first_aid').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting first aid log locally.");
      }
      await firstAidCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['firstAid'] })
  });

  return {
    logs: logs.filter(l => !l.is_deleted),
    isLoading,
    addFirstAid: addFirstAidMutation.mutateAsync,
    deleteFirstAid: deleteFirstAidMutation.mutateAsync,
    isMutating: addFirstAidMutation.isPending || deleteFirstAidMutation.isPending
  };
}
