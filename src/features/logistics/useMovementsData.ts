import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { InternalMovement } from '../../types';

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['internal_movements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('internal_movements').select('*');
      if (error) throw error;
      return data as InternalMovement[];
    },
    select: (data) => data.filter(m => !m.is_deleted)
  });

  const addMovementMutation = useMutation({
    mutationFn: async (movement: Partial<InternalMovement>) => {
      const { data, error } = await supabase.from('internal_movements').insert([{
        ...movement,
        id: movement.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal_movements'] })
  });

  return { 
    movements, 
    isLoading, 
    addMovement: addMovementMutation.mutateAsync,
    isOffline: false
  };
};
