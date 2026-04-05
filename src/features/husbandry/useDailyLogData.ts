import { useMemo, useCallback } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection } from '../../lib/database';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const { animals, isLoading: animalsLoading } = useAnimalsData();

  // 1. FETCH LOGS
  const { data: logs = [], isLoading: logsLoading } = useLiveQuery(dailyLogsCollection);
  
  const dailyLogs = useMemo(() => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.filter(log => 
      !log.is_deleted && 
      (_viewDate === 'all' || log.log_date === targetDate) && 
      (!animalId || log.animal_id === animalId)
    );
  }, [logs, _viewDate, animalId]);

  const getTodayLog = useCallback((animalId: string, type: LogType) => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.find(log => log.animal_id === animalId && log.log_type === type && log.log_date === targetDate);
  }, [logs, _viewDate]);

  const addLogEntry = useCallback(async (entry: Partial<LogEntry>) => {
    const newEntry: Partial<LogEntry> = {
      id: entry.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      ...entry
    };
    
    await dailyLogsCollection.insert(newEntry as LogEntry);
  }, []);

  const updateLogEntry = useCallback(async (entry: Partial<LogEntry>) => {
    if (!entry.id) throw new Error("Cannot update without an ID");
    const existing = logs.find(l => l.id === entry.id);
    if (existing) {
      await dailyLogsCollection.update({ ...existing, ...entry });
    }
  }, [logs]);

  const deleteLogEntry = useCallback(async (id: string) => {
    const existing = logs.find(l => l.id === id);
    if (existing) {
      await dailyLogsCollection.update({ ...existing, is_deleted: true });
    }
  }, [logs]);

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => activeCategory === 'all' || a.category === activeCategory);
  }, [animals, activeCategory]);

  return { 
    animals: filteredAnimals, 
    getTodayLog, 
    addLogEntry, 
    updateLogEntry,
    deleteLogEntry,
    dailyLogs, 
    isLoading: animalsLoading || logsLoading,
    isOffline: false
  };
};
