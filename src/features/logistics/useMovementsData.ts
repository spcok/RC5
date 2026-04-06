import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { InternalMovement } from '../../types';

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery<InternalMovement[]>({
    queryKey: ['movements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('movements').select('*');
        if (error) throw error;
        data.forEach(item => movementsCollection.update(item.id, () => item as InternalMovement).catch(() => movementsCollection.insert(item as InternalMovement)));
        return data as InternalMovement[];
      } catch {
        console.warn("Network unreachable. Serving movements from local vault.");
        return await movementsCollection.getAll();
      }
    }
  });

  const addMovementMutation = useMutation({
    mutationFn: async (movement: Partial<InternalMovement>) => {
      const payload: InternalMovement = {
        ...movement,
        id: movement.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false
      } as InternalMovement;
      try {
        const { error } = await supabase.from('movements').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding movement locally.");
      }
      await movementsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movements'] })
  });

  return { 
    movements: movements.filter(m => !m.is_deleted), 
    isLoading, 
    addMovement: addMovementMutation.mutateAsync,
    isMutating: addMovementMutation.isPending
  };
};
