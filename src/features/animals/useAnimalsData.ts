import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data: cloudData, error: fetchError } = await supabase
        .from('animals')
        .select('*');
      
      if (fetchError) throw fetchError;
      return cloudData as Animal[];
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
