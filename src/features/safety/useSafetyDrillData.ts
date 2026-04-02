import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const queryClient = useQueryClient();

  const { data: drills = [], isLoading } = useQuery({
    queryKey: ['safety_drills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_drills')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw error;
      return (data || []) as SafetyDrill[];
    }
  });

  const logDrillMutation = useMutation({
    mutationFn: async (newDrill: Omit<SafetyDrill, 'id'>) => {
      const { data, error } = await supabase.from('safety_drills').insert([newDrill]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety_drills'] })
  });

  const deleteDrillMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('safety_drills').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
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
