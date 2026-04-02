import { useQuery } from '@tanstack/react-query';
import { Animal } from '../../types';
import { supabase } from '../../lib/supabase';

export function useAnimalProfileData(animalId: string | undefined) {
  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', animalId],
    queryFn: async () => {
      if (!animalId) return null;
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('id', animalId)
        .single();
      
      if (error) throw error;
      return data as Animal;
    },
    enabled: !!animalId,
  });

  return { animal, isLoading };
}
