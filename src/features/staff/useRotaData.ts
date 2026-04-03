import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { Shift } from '../../types';

export const useRotaData = () => {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['staff_rota'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('staff_rota').select('*');
        if (error) throw error;
        if (data) await db.rota.bulkPut(data);
        return data as Shift[];
      } catch (err) {
        console.log('📡 Network offline. Reading Rota from Dexie...', err);
        return await db.rota.toArray();
      }
    },
    select: (data) => data.filter(s => !s.is_deleted)
  });

  const addShiftMutation = useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      const payload = {
        ...shift,
        id: shift.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { data, error } = await supabase.from('staff_rota').insert([payload]).select().single();
        if (error) throw error;
        await db.rota.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Rota locally...', err);
        await db.rota.put(payload as Shift);
        return payload as Shift;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  const updateShiftMutation = useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      try {
        const { data, error } = await supabase.from('staff_rota').update(shift).eq('id', shift.id!).select().single();
        if (error) throw error;
        await db.rota.update(shift.id!, shift);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Updating Rota locally...', err);
        await db.rota.update(shift.id!, shift);
        return shift as Shift;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data, error } = await supabase.from('staff_rota').update({ is_deleted: true }).eq('id', id).select().single();
        if (error) throw error;
        await db.rota.update(id, { is_deleted: true });
        return data;
      } catch (err) {
        console.log('📡 Network offline. Deleting Rota locally...', err);
        await db.rota.update(id, { is_deleted: true });
        return { id, is_deleted: true } as Shift;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  return { 
    shifts, 
    isLoading, 
    addShift: addShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync
  };
};
