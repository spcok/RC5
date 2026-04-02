import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Animal, AnimalCategory, LogType, LogEntry, Task } from '../../types';

export interface EnhancedAnimal extends Animal {
  todayWeight?: LogEntry;
  todayFeed?: LogEntry;
  lastFedStr: string;
  displayId: string;
  nextFeedTask?: { due_date: string; notes?: string };
}

export interface AnimalStatsData {
  todayWeight?: { weight?: number; weight_unit?: string; weight_grams?: number; value?: string | number; log_date?: string | Date };
  previousWeight?: { weight?: number; weight_unit?: string; weight_grams?: number; value?: string | number; log_date?: string | Date };
  todayFeed?: { value?: string | number; log_date?: string | Date };
}

export interface PendingTask {
  id: string;
  title: string;
  due_date?: string;
}

// We fetch everything in parallel using TanStack Query
export function useDashboardData(activeTab: AnimalCategory | 'ARCHIVED') {
  
  // 1. Fetch Animals
  const { data: rawAnimals = [], isLoading: animalsLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('animals').select('*');
      if (error) throw error;
      return data as Animal[];
    }
  });

  // 2. Fetch Logs
  const { data: rawLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_logs').select('*');
      if (error) throw error;
      return data as LogEntry[];
    }
  });

  // 2b. Fetch Today's Logs
  const { data: todayLogs = [], isLoading: todayLogsLoading } = useQuery({
    queryKey: ['daily_logs_today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('daily_logs').select('*').eq('log_date', today);
      if (error) throw error;
      return data as LogEntry[];
    }
  });

  // 3. Fetch Tasks
  const { data: rawTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) throw error;
      return data as Task[];
    }
  });

  const isLoading = animalsLoading || logsLoading || tasksLoading || todayLogsLoading;

  // Filter base datasets
  const liveAnimals = useMemo(() => rawAnimals.filter(a => !a.is_deleted && !a.archived), [rawAnimals]);
  const archivedAnimals = useMemo(() => rawAnimals.filter(a => !a.is_deleted && a.archived), [rawAnimals]);
  const logs = useMemo(() => rawLogs.filter(l => !l.is_deleted), [rawLogs]);
  const tasks = useMemo(() => rawTasks.filter(t => !t.is_deleted), [rawTasks]);
  const todayLogsFiltered = useMemo(() => todayLogs.filter(l => !l.is_deleted), [todayLogs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('alpha-asc');
  const [isOrderLocked, setIsOrderLocked] = useState(false);

  // Compute Animal Stats
  const animalStats = useMemo(() => {
    let filtered = liveAnimals;
    if (activeTab && activeTab !== AnimalCategory.ALL && activeTab !== 'ARCHIVED') {
      filtered = filtered.filter(a => a.category === activeTab);
    }
    
    const filteredIds = new Set(filtered.map(a => a.id));
    const todayLogs = todayLogsFiltered.filter(l => filteredIds.has(l.animal_id));
    
    const weighed = new Set(todayLogs.filter(l => l.log_type === LogType.WEIGHT).map(l => l.animal_id)).size;
    const fed = new Set(todayLogs.filter(l => l.log_type === LogType.FEED).map(l => l.animal_id)).size;

    return { total: filtered.length, weighed, fed, animalData: new Map<string, AnimalStatsData>() };
  }, [liveAnimals, activeTab, todayLogsFiltered]);

  // Compute Task Stats
  const taskStats = useMemo(() => {
    const pendingTasks = tasks.filter(t => !t.completed && t.type !== 'HEALTH').map(t => ({ id: t.id, title: t.title, due_date: t.due_date }));
    const pendingHealth = tasks.filter(t => !t.completed && t.type === 'HEALTH').map(t => ({ id: t.id, title: t.title, due_date: t.due_date }));
    return { pendingTasks, pendingHealth };
  }, [tasks]);

  // Build the Final UI List
  const filteredAnimals = useMemo(() => {
    let result = activeTab === 'ARCHIVED' ? [...archivedAnimals] : [...liveAnimals];
    
    if (activeTab && activeTab !== AnimalCategory.ALL && activeTab !== 'ARCHIVED') {
      result = result.filter(a => a.category === activeTab);
    }
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(lower) || 
        a.species?.toLowerCase().includes(lower) || 
        a.latin_name?.toLowerCase().includes(lower)
      );
    }
    
    if (sortOption === 'alpha-asc') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortOption === 'alpha-desc') result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));

    // Map the rich data onto the animal rows
    return result.map(animal => {
      const animalTodayLogs = todayLogsFiltered.filter(l => l.animal_id === animal.id);
      const todayWeight = animalTodayLogs.find(l => l.log_type === LogType.WEIGHT);
      const todayFeed = animalTodayLogs.find(l => l.log_type === LogType.FEED);
      
      const animalAllLogs = logs.filter(l => l.animal_id === animal.id);
      const feedLogs = animalAllLogs.filter(l => l.log_type === LogType.FEED).sort((a, b) => {
          const timeA = new Date(a.created_at || a.log_date || 0).getTime();
          const timeB = new Date(b.created_at || b.log_date || 0).getTime();
          return timeB - timeA;
      });
      
      const lastFedStr = feedLogs[0] ? `${feedLogs[0].value} ${new Date(feedLogs[0].created_at || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-';
      const displayId = (animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS) ? (animal.ring_number || '-') : (animal.microchip_id || '-');
      
      return { ...animal, todayWeight, todayFeed, lastFedStr, displayId } as EnhancedAnimal;
    });
  }, [liveAnimals, archivedAnimals, activeTab, searchTerm, sortOption, logs, todayLogsFiltered]);

  const toggleOrderLock = (locked: boolean) => setIsOrderLocked(locked);
  const cycleSort = () => setSortOption(prev => prev === 'alpha-asc' ? 'alpha-desc' : prev === 'alpha-desc' ? 'custom' : 'alpha-asc');

  return { filteredAnimals, animalStats, taskStats, isLoading, searchTerm, setSearchTerm, sortOption, cycleSort, isOrderLocked, toggleOrderLock };
}
