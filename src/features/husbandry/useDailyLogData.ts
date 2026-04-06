import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const { animals, isLoading: animalsLoading } = useAnimalsData();
  const queryClient = useQueryClient();

  // 1. FETCH LOGS (Online-First)
  const { data: logs = [], isLoading: logsLoading } = useQuery<LogEntry[]>({
    queryKey: ['dailyLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('daily_logs').select('*');
        if (error) throw error;
        
        // Refresh local vault
        data.forEach(item => dailyLogsCollection.update(item.id, () => item as LogEntry).catch(() => dailyLogsCollection.insert(item as LogEntry)));
        
        return data as LogEntry[];
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
  });
  
  const dailyLogs = useMemo(() => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.filter(log => 
      !log.is_deleted && 
      (_viewDate === 'all' || log.log_date === targetDate) && 
      (!animalId || log.animal_id === animalId)
    );
  }, [logs, _viewDate, animalId]);

  const getTodayLog = (animalId: string, type: LogType) => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.find(log => log.animal_id === animalId && log.log_type === type && log.log_date === targetDate);
  };

  const addLogEntryMutation = useMutation({
    mutationFn: async (entry: Partial<LogEntry>) => {
      const newEntry: LogEntry = {
        id: entry.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_deleted: false,
        ...entry
      } as LogEntry;

      try {
        const { error } = await supabase.from('daily_logs').insert([newEntry]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding log entry locally.");
      }
      await dailyLogsCollection.insert(newEntry);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const updateLogEntryMutation = useMutation({
    mutationFn: async (entry: Partial<LogEntry>) => {
      if (!entry.id) throw new Error("Cannot update without an ID");

      try {
        const { error } = await supabase.from('daily_logs').update(entry).eq('id', entry.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating log entry locally.");
      }
      await dailyLogsCollection.update(entry.id, (prev) => ({ ...prev, ...entry }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const deleteLogEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('daily_logs').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting log entry locally.");
      }
      await dailyLogsCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => activeCategory === 'all' || a.category === activeCategory);
  }, [animals, activeCategory]);

  return { 
    animals: filteredAnimals, 
    getTodayLog, 
    addLogEntry: addLogEntryMutation.mutateAsync, 
    updateLogEntry: updateLogEntryMutation.mutateAsync,
    deleteLogEntry: deleteLogEntryMutation.mutateAsync,
    dailyLogs, 
    isLoading: animalsLoading || logsLoading,
    isMutating: addLogEntryMutation.isPending || updateLogEntryMutation.isPending || deleteLogEntryMutation.isPending
  };
};
