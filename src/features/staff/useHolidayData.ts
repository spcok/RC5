import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { Holiday } from '../../types';

export function useHolidayData() {
  const queryClient = useQueryClient();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('holidays')
          .select('*')
          .eq('is_deleted', false);
        if (error) throw error;
        if (data) await db.holidays.bulkPut(data);
        return data as Holiday[];
      } catch (err) {
        console.log('📡 Network offline. Reading Holidays from Dexie...', err);
        return await db.holidays.where('is_deleted').equals(false).toArray();
      }
    },
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
      const payload = { ...holiday, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase
          .from('holidays')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        await db.holidays.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Holiday locally...', err);
        await db.holidays.put(payload as Holiday);
        return payload as Holiday;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('holidays')
          .update({ is_deleted: true })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await db.holidays.update(id, { is_deleted: true });
        return data;
      } catch (err) {
        console.log('📡 Network offline. Deleting Holiday locally...', err);
        await db.holidays.update(id, { is_deleted: true });
        return { id, is_deleted: true } as Holiday;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  });

  return {
    holidays,
    isLoading,
    addHoliday: addHolidayMutation.mutateAsync,
    deleteHoliday: deleteHolidayMutation.mutateAsync,
  };
}
