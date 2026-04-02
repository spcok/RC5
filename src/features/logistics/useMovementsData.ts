import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { InternalMovement } from '../../types';

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['internal_movements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('internal_movements').select('*');
        if (error) throw error;
        if (data) await db.movements.bulkPut(data);
        return data as InternalMovement[];
      } catch (err) {
        console.log('📡 Network offline. Reading Movements from Dexie...', err);
        return await db.movements.toArray();
      }
    },
    select: (data) => data.filter(m => !m.is_deleted)
  });

  const addMovementMutation = useMutation({
    mutationFn: async (movement: Partial<InternalMovement>) => {
      const payload = {
        ...movement,
        id: movement.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { data, error } = await supabase.from('internal_movements').insert([payload]).select().single();
        if (error) throw error;
        await db.movements.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Movement locally...', err);
        await db.movements.put(payload as InternalMovement);
        return payload as InternalMovement;
      }
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
