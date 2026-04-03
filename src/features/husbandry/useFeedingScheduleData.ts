import { useLiveQuery } from '@tanstack/react-db';
import { dailyLogsCollection } from '../../lib/database';
import { LogType } from '../../types';

export function useFeedingScheduleData(date: string) {
  const { data: logs = [], isLoading } = useLiveQuery(dailyLogsCollection);

  const feedingLogs = logs.filter(l => l.log_date === date && l.log_type === LogType.FEEDING);

  return {
    data: feedingLogs,
    isLoading
  };
}
