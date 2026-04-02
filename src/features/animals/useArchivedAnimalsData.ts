import { useQuery } from '@tanstack/react-query';
import { Animal } from '../../types';
import { supabase } from '../../lib/supabase';

export function useArchivedAnimalsData() {
  const { data: archivedAnimals = [], isLoading, error } = useQuery({
    queryKey: ['archived_animals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('is_deleted', true);
      if (error) throw error;
      return data as Animal[];
    },
  });

  return { archivedAnimals, isLoading, error: error as Error | null };
}
