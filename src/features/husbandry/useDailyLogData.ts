import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUKLocalDate } from '../../services/temporalService';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';
import { queueDatabaseOperation } from '../../lib/offlineSync';
import { db } from '../../lib/dexieDb';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const queryClient = useQueryClient();
  const { animals, isLoading: animalsLoading } = useAnimalsData();

  // 1. FETCH LOGS
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['daily_logs', _viewDate, animalId],
    queryFn: async () => {
      const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
      try {
        let query = supabase.from('daily_logs').select('*').eq('log_date', targetDate);
        if (animalId) query = query.eq('animal_id', animalId);

        const { data, error } = await query;
        if (error) throw error;
        return data as LogEntry[];
      } catch (err) {
        console.log('📡 Network offline. Reading Daily Logs from Dexie...', err);
        let localLogs = await db.daily_logs.where('log_date').equals(targetDate).toArray();

        if (animalId) {
          localLogs = localLogs.filter(log => log.animal_id === animalId);
        }
        return localLogs;
      }
    },
    select: (data) => data.filter(log => !log.is_deleted)
  });

  // 2. OPTIMISTIC MUTATION
  const addLogMutation = useMutation({
    mutationFn: async (newLog: Partial<LogEntry>) => {
      try {
        // Attempt Online Save
        const { data, error } = await supabase.from('daily_logs').insert([newLog]).select().single();
        if (error) throw error;
        
        // Keep Shadow DB in sync
        if (data) await db.daily_logs.put(data); 
        return data as LogEntry;
      } catch (err) {
        console.log('📡 Network offline. Saving log locally...', err);
        // Generate a temporary ID for the UI
        const tempLog = { 
          ...newLog, 
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString()
        } as LogEntry;
        
        await db.daily_logs.put(tempLog);
        
        // Queue for background sync
        try {
          await queueDatabaseOperation({
            id: crypto.randomUUID(),
            table: 'daily_logs',
            payload: tempLog,
            timestamp: Date.now()
          });
        } catch (queueErr) {
          console.error('⚠️ Failed to queue offline log:', queueErr);
        }

        return tempLog;
      }
    },
    onMutate: async (newLog) => {
      const targetQueryKey = ['daily_logs', _viewDate, animalId];
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: targetQueryKey });

      // Snapshot the previous value
      const previousLogs = queryClient.getQueryData<LogEntry[]>(targetQueryKey);

      const optimisticLog = { ...newLog, id: newLog.id || `temp_${Date.now()}` } as LogEntry;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily_logs_today'] });
    },
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
