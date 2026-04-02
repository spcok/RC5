import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Shift } from '../../types';

export const useRotaData = () => {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['staff_rota'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_rota').select('*');
      if (error) throw error;
      return data as Shift[];
    },
    select: (data) => data.filter(s => !s.is_deleted)
  });

  const addShiftMutation = useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      const { data, error } = await supabase.from('staff_rota').insert([{
        ...shift,
        id: shift.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  const updateShiftMutation = useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      const { data, error } = await supabase.from('staff_rota').update(shift).eq('id', shift.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('staff_rota').update({ is_deleted: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
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
