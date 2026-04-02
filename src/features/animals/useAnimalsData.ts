import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types';
import { db } from '../../lib/dexieDb';

export const useAnimalsData = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data: cloudData, error: fetchError } = await supabase.from('animals').select('*');
        if (fetchError) throw fetchError;
        return cloudData as Animal[];
      } catch (_err) {
        console.log('📡 Network offline. Reading Animals from Dexie...');
        const localData = await db.animals.toArray();
        return localData;
      }
    },
    // The select function allows us to cache the raw DB state, 
    // but only hand active, clean data to the React components.
    select: (rawAnimals) => {
      return rawAnimals.filter(animal => !animal.is_deleted && !animal.archived);
    }
  });

  return { 
    animals: data || [], 
    isLoading, 
    isOffline: false // TanStack handles offline natively now
  };
};
