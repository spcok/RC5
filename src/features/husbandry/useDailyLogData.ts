import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUKLocalDate } from '../../services/temporalService';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const queryClient = useQueryClient();
  const { animals, isLoading: animalsLoading } = useAnimalsData();

  // 1. FETCH LOGS
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['daily_logs', _viewDate, animalId],
    queryFn: async () => {
      let query = supabase.from('daily_logs').select('*');
      const targetDate = _viewDate === 'today' 
        ? getUKLocalDate() 
        : _viewDate;
      
      query = query.eq('log_date', targetDate);
      
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as LogEntry[];
    },
    select: (data) => data.filter(log => !log.is_deleted)
  });

  // 2. OPTIMISTIC MUTATION
  const addLogMutation = useMutation({
    mutationFn: async (newLog: Partial<LogEntry>) => {
      const { data, error } = await supabase.from('daily_logs').upsert([newLog], { onConflict: 'id' }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (newLog) => {
      const targetQueryKey = ['daily_logs', _viewDate, animalId];
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: targetQueryKey });

      // Snapshot the previous value
      const previousLogs = queryClient.getQueryData<LogEntry[]>(targetQueryKey);

      const optimisticLog = { ...newLog, id: newLog.id || crypto.randomUUID() } as LogEntry;

      // Optimistically update to the new value instantly
      if (previousLogs) {
        queryClient.setQueryData<LogEntry[]>(targetQueryKey, [...previousLogs.filter(l => l.id !== optimisticLog.id), optimisticLog]);
      } else {
        queryClient.setQueryData<LogEntry[]>(targetQueryKey, [optimisticLog]);
      }

      // Return a context object with the snapshotted value
      return { previousLogs };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, _newLog, context) => {
      console.error("Mutation failed, rolling back cache", err);
      const targetQueryKey = ['daily_logs', _viewDate, animalId];
      if (context?.previousLogs) {
        queryClient.setQueryData(targetQueryKey, context.previousLogs);
      }
    },
    // Always refetch after error or success to ensure server sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
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
