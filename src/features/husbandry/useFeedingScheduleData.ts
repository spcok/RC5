import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useFeedingScheduleData(date: string) {
  return useQuery({
    queryKey: ['feeding_logs', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*, animals(name, species)')
        .eq('log_type', 'FEEDING')
        .eq('log_date', date);

      if (error) throw error;
      return data;
    },
  });
}
