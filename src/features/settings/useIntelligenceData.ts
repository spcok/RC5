import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { Animal } from '../../types';

export const useIntelligenceData = () => {
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['intelligence_animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*');
        if (error) throw error;
        if (data) await db.animals.bulkPut(data);
        return (data || []) as Animal[];
      } catch (err) {
        console.log('📡 Network offline. Reading Animals from Dexie...', err);
        return await db.animals.toArray();
      }
    }
  });

  const runIUCNScan = async () => {
    if (!navigator.onLine) {
      console.log("IUCN Scan skipped: Network offline.");
      return null;
    }
    console.log("IUCN Scan Triggered");
    return true;
  };

  return {
    animals,
    isLoading,
    runIUCNScan
  };
};
