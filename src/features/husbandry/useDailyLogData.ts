import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType, AnimalCategory } from '../../types';

interface SupabaseLogEntry {
  id: string;
  animal_id: string | null;
  log_type: string | null;
  log_date: string | null;
  value: string | null;
  notes: string | null;
  user_initials: string | null;
  weight_grams: number | null;
  weight: number | null;
  weight_unit: string | null;
  health_record_type: string | null;
  basking_temp_c: number | null;
  cool_temp_c: number | null;
  temperature_c: number | null;
  created_at: string;
  created_by: string | null;
  integrity_seal: string | null;
  updated_at: string;
  is_deleted: boolean;
}

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
        
        const mappedData: LogEntry[] = (data as unknown as SupabaseLogEntry[]).map((item: SupabaseLogEntry) => ({
          id: item.id,
          animalId: item.animal_id || '',
          logType: (item.log_type as LogType) || LogType.GENERAL,
          logDate: item.log_date || '',
          value: item.value || '',
          notes: item.notes || undefined,
          userInitials: item.user_initials || undefined,
          weightGrams: item.weight_grams || undefined,
          weight: item.weight || undefined,
          weightUnit: (item.weight_unit as LogEntry['weightUnit']) || undefined,
          healthRecordType: item.health_record_type || undefined,
          baskingTempC: item.basking_temp_c || undefined,
          coolTempC: item.cool_temp_c || undefined,
          temperatureC: item.temperature_c || undefined,
          createdAt: item.created_at || '',
          createdBy: item.created_by || undefined,
          integritySeal: item.integrity_seal || undefined,
          updatedAt: item.updated_at || '',
          isDeleted: item.is_deleted || false
        }));
        
        // Refresh local vault
        for (const item of mappedData) {
          try {
            await dailyLogsCollection.update(item.id, () => item);
          } catch {
            await dailyLogsCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
  });
  
  const dailyLogs = useMemo(() => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.filter(log => 
      !log.isDeleted && 
      (_viewDate === 'all' || log.logDate === targetDate) && 
      (!animalId || log.animalId === animalId)
    );
  }, [logs, _viewDate, animalId]);

  const getTodayLog = (animalId: string, type: LogType) => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.find(log => log.animalId === animalId && log.logType === type && log.logDate === targetDate);
  };

  const addLogEntryMutation = useMutation({
    mutationFn: async (entry: Partial<LogEntry>) => {
      const newEntry: LogEntry = {
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
      } as LogEntry;

      const supabasePayload = {
        id: newEntry.id,
        animal_id: newEntry.animalId,
        log_type: newEntry.logType,
        log_date: newEntry.logDate,
        value: newEntry.value,
        notes: newEntry.notes,
        user_initials: newEntry.userInitials,
        weight_grams: newEntry.weightGrams,
        weight: newEntry.weight,
        weight_unit: newEntry.weightUnit,
        health_record_type: newEntry.healthRecordType,
        basking_temp_c: newEntry.baskingTempC,
        cool_temp_c: newEntry.coolTempC,
        temperature_c: newEntry.temperatureC,
        created_at: newEntry.createdAt,
        created_by: newEntry.createdBy,
        integrity_seal: newEntry.integritySeal,
        updated_at: newEntry.updatedAt,
        is_deleted: newEntry.isDeleted
      };

      try {
        const { error } = await supabase.from('daily_logs').insert([supabasePayload]);
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

      const supabasePayload = {
        animal_id: entry.animalId,
        log_type: entry.logType,
        log_date: entry.logDate,
        value: entry.value,
        notes: entry.notes,
        user_initials: entry.userInitials,
        weight_grams: entry.weightGrams,
        weight: entry.weight,
        weight_unit: entry.weightUnit,
        health_record_type: entry.healthRecordType,
        basking_temp_c: entry.baskingTempC,
        cool_temp_c: entry.coolTempC,
        temperature_c: entry.temperatureC,
        created_at: entry.createdAt,
        created_by: entry.createdBy,
        integrity_seal: entry.integritySeal,
        updated_at: new Date().toISOString(),
        is_deleted: entry.isDeleted
      };

      try {
        const { error } = await supabase.from('daily_logs').update(supabasePayload).eq('id', entry.id);
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
      await dailyLogsCollection.update(id, (prev) => ({ ...prev, isDeleted: true }));
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
