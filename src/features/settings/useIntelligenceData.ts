import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types';

export const useIntelligenceData = () => {
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['intelligence_animals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals').select('*');
      if (error) throw error;
      return (data || []) as Animal[];
    }
  });

  const runIUCNScan = async () => {
    console.log("IUCN Scan Triggered");
  };

  return {
    animals,
    isLoading,
    runIUCNScan
  };
};
