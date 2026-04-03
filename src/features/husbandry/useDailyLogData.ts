import { useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/db';
import { getUKLocalDate } from '../../services/temporalService';
import { db } from '../../lib/database';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const queryClient = useQueryClient();
  const { animals, isLoading: animalsLoading } = useAnimalsData();

  // 1. FETCH LOGS
  const { data: logs = [], isLoading: logsLoading } = useLiveQuery({
    queryKey: ['daily_logs', _viewDate, animalId],
    queryFn: () => {
      const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
      const query: any = { log_date: targetDate };
      if (animalId) query.animal_id = animalId;
      return db.daily_logs.findMany({ where: query });
    },
  });
  
  const dailyLogs = useMemo(() => logs.filter(log => !log.is_deleted), [logs]);

  // 2. OPTIMISTIC MUTATION
  const addLogMutation = useMutation({
    mutationFn: async (newLog: Partial<LogEntry>) => {
      const logToSave = { 
        ...newLog, 
        id: newLog.id || crypto.randomUUID(),
        created_at: new Date().toISOString()
      } as LogEntry;
      
      return await db.daily_logs.insert(logToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily_logs_today'] });
    },
  });

  const getTodayLog = useCallback((animalId: string, type: LogType) => {
    return logs.find(log => log.animal_id === animalId && log.log_type === type);
  }, [logs]);

  const addLogEntry = useCallback(async (entry: Partial<LogEntry>) => {
    const newEntry: Partial<LogEntry> = {
      id: entry.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      ...entry
    };
    
    // Fire the optimistic mutation
    await addLogMutation.mutateAsync(newEntry);
  }, [addLogMutation]);

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => activeCategory === 'all' || a.category === activeCategory);
  }, [animals, activeCategory]);

  return { 
    animals: filteredAnimals, 
    getTodayLog, 
    addLogEntry, 
    dailyLogs: logs, 
    isLoading: animalsLoading || logsLoading,
    isOffline: false // Tanstack persists the cache implicitly
  };
};
