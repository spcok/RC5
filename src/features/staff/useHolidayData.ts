import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Holiday } from '../../types';

export function useHolidayData() {
  const queryClient = useQueryClient();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw error;
      return data as Holiday[];
    },
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert([holiday])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('holidays')
        .update({ is_deleted: true })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
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
