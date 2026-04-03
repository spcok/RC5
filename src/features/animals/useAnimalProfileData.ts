import { useQuery } from '@tanstack/react-query';
import { Animal } from '../../types';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';

export function useAnimalProfileData(animalId: string | undefined) {
  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', animalId],
    queryFn: async () => {
      if (!animalId) return null;
      try {
        const { data, error } = await supabase.from('animals').select('*').eq('id', animalId).single();
        if (error) throw error;
        return data as Animal;
      } catch (err) {
        console.log('📡 Network offline. Reading from Dexie...');
        const localData = await db.animals.get(animalId);
        if (!localData) throw new Error('Animal not found in local cache');
        return localData;
      }
    },
    enabled: !!animalId,
  });

  return { animal, isLoading };
}
