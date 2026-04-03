import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';

export function useFeedingScheduleData(date: string) {
  return useQuery({
    queryKey: ['feeding_logs', date],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select('*, animals(name, species)')
          .eq('log_type', 'FEEDING')
          .eq('log_date', date);

        if (error) throw error;
        if (data) await db.daily_logs.bulkPut(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Reading Feeding Logs from Dexie...', err);
        return await db.daily_logs
          .where('log_date')
          .equals(date)
          .and(l => l.log_type === 'FEEDING')
          .toArray();
      }
    },
  });
}
