import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';

// 1. Animals Collection
export const animalsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['animals'],
    queryClient,
    getKey: (item: any) => item.id,
    queryFn: async () => {
      // CLEAN SLATE: Fetch directly from Supabase
      const { data, error } = await supabase.from('animals').select('*').eq('is_deleted', false);
      if (error) throw error;
      return data || [];
    },
    onInsert: async (draft: any) => {
      const { error } = await supabase.from('animals').upsert([draft]);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    onUpdate: async (draft: any) => {
      const { error } = await supabase.from('animals').update(draft).eq('id', draft.id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    }
  })
);

// 2. Daily Logs Collection (14-Day Offline Failover Compliant)
export const dailyLogsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['daily_logs'],
    queryClient,
    getKey: (item: any) => item.id,
    queryFn: async () => {
      // CLEAN SLATE: Fetch directly from Supabase respecting 14-day window
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .gte('log_date', fourteenDaysAgo.toISOString().split('T')[0])
        .eq('is_deleted', false);
      if (error) throw error;
      return data || [];
    },
    onInsert: async (draft: any) => {
      const { error } = await supabase.from('daily_logs').upsert([draft]);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    }
  })
);

// 3. Tasks Collection
export const tasksCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['tasks'],
    queryClient,
    getKey: (item: any) => item.id,
    queryFn: async () => {
      // CLEAN SLATE: Fetch directly from Supabase
      const { data, error } = await supabase.from('tasks').select('*').eq('is_deleted', false);
      if (error) throw error;
      return data || [];
    },
    onUpdate: async (draft: any) => {
      const { error } = await supabase.from('tasks').update(draft).eq('id', draft.id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    }
  })
);
