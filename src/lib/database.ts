import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';

// 1. Animals Collection
export const animalsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['animals'],
    queryClient,
    getKey: (item: unknown) => (item as { id: string }).id,
    queryFn: async () => {
      // CLEAN SLATE: Fetch directly from Supabase
      const { data, error } = await supabase.from('animals').select('*').eq('is_deleted', false);
      if (error) throw error;
      return data || [];
    },
    onInsert: async (draft: unknown) => {
      const { error } = await supabase.from('animals').upsert([draft]);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    onUpdate: async (draft: unknown) => {
      const { error } = await supabase.from('animals').update(draft).eq('id', (draft as { id: string }).id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    }
  })
);

// 2. Daily Logs Collection (14-Day Offline Failover Compliant)
export const dailyLogsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['daily_logs'],
    queryClient,
    getKey: (item: unknown) => (item as { id: string }).id,
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
    onInsert: async (draft: unknown) => {
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
    getKey: (item: unknown) => (item as { id: string }).id,
    queryFn: async () => {
      // CLEAN SLATE: Fetch directly from Supabase
      const { data, error } = await supabase.from('tasks').select('*').eq('is_deleted', false);
      if (error) throw error;
      return data || [];
    },
    onUpdate: async (draft: unknown) => {
      const { error } = await supabase.from('tasks').update(draft).eq('id', (draft as { id: string }).id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    }
  })
);

// --- COLLECTION FACTORY ---
// Generates standard Clean-Slate Supabase collections for remaining modules
export const createStandardCollection = (tableName: string) => {
  return createCollection(
    queryCollectionOptions({
      queryKey: [tableName],
      queryClient,
      getKey: (item: unknown) => (item as { id: string }).id,
      queryFn: async () => {
        const { data, error } = await supabase.from(tableName).select('*').eq('is_deleted', false);
        if (error) throw error;
        return data || [];
      },
      onInsert: async (draft: unknown) => {
        const { error } = await supabase.from(tableName).upsert([draft]);
        if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
      },
      onUpdate: async (draft: unknown) => {
        const { error } = await supabase.from(tableName).update(draft).eq('id', (draft as { id: string }).id);
        if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
      }
    })
  );
};

// --- SETTINGS & USERS MODULES ---
export const usersCollection = createStandardCollection('users');
export const orgSettingsCollection = createStandardCollection('org_settings');
export const zlaDocumentsCollection = createStandardCollection('zla_documents');
export const directoryCollection = createStandardCollection('directory');

// --- MEDICAL & LOGISTICS MODULES ---
export const medicalLogsCollection = createStandardCollection('medical_logs');
export const marChartsCollection = createStandardCollection('mar_charts');
export const quarantineRecordsCollection = createStandardCollection('quarantine_records');
export const movementsCollection = createStandardCollection('movements');
export const transfersCollection = createStandardCollection('transfers');

// --- STAFF MODULES ---
export const timesheetsCollection = createStandardCollection('timesheets');
export const rotaCollection = createStandardCollection('rota');
export const holidaysCollection = createStandardCollection('holidays');

// --- SAFETY MODULES ---
export const safetyDrillsCollection = createStandardCollection('safety_drills');
export const incidentsCollection = createStandardCollection('incidents');
export const maintenanceCollection = createStandardCollection('maintenance');
export const firstAidCollection = createStandardCollection('first_aid');
