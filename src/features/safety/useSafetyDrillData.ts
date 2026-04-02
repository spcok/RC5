import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const queryClient = useQueryClient();

  const { data: drills = [], isLoading } = useQuery({
    queryKey: ['safety_drills'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('safety_drills')
          .select('*')
          .eq('is_deleted', false);
        if (error) throw error;
        if (data) await db.safety_drills.bulkPut(data);
        return (data || []) as SafetyDrill[];
      } catch (err) {
        console.log('📡 Network offline. Reading Safety Drills from Dexie...', err);
        return await db.safety_drills.where('is_deleted').equals(false).toArray();
      }
    }
  });

  const logDrillMutation = useMutation({
    mutationFn: async (newDrill: Omit<SafetyDrill, 'id'>) => {
      const payload = { ...newDrill, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase.from('safety_drills').insert([payload]).select().single();
        if (error) throw error;
        await db.safety_drills.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Safety Drill locally...', err);
        await db.safety_drills.put(payload as SafetyDrill);
        return payload as SafetyDrill;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety_drills'] })
  });

  const deleteDrillMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('safety_drills').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await db.safety_drills.update(id, { is_deleted: true });
      } catch (err) {
        console.log('📡 Network offline. Deleting Safety Drill locally...', err);
        await db.safety_drills.update(id, { is_deleted: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety_drills'] })
  });

  return {
    drills,
    isLoading,
    addDrillLog: logDrillMutation.mutateAsync,
    deleteDrillLog: deleteDrillMutation.mutateAsync
  };
};
