import { useQuery } from '@tanstack/react-query';
import { dailyLogsCollection } from '../../lib/database';
import { LogType } from '../../types';

export function useFeedingScheduleData(date: string) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['dailyLogs'],
    queryFn: async () => await dailyLogsCollection.all()
  });

  const feedingLogs = logs.filter(l => l.log_date === date && l.log_type === LogType.FEED);

  return {
    data: feedingLogs,
    isLoading
  };
}
