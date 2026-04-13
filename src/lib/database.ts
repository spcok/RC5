import { createCollection as baseCreateCollection } from '@tanstack/react-db';
import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { LogEntry, Animal, Timesheet } from '../types';
import { mapToCamelCase } from './dataMapping';

// --- 1. GLOBAL SNAKE CASE TRANSLATOR ---
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const mapToSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[toSnakeCase(key)] = obj[key];
    }
  }
  return newObj;
};

interface CollectionOptions {
  hasSoftDelete?: boolean;
}

const createFailoverCollection = <T extends { id: string | number }>(
  tableName: string, 
  options: CollectionOptions = { hasSoftDelete: true }
) => {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [tableName],
      queryFn: async () => {
        if (!navigator.onLine) {
          throw new Error(`[Network] Offline. Preserving local vault for ${tableName}.`);
        }
        
        let query = supabase.from(tableName).select('*');
        if (options.hasSoftDelete) {
          query = query.eq('is_deleted', false);
        }
          
        const { data, error } = await query;
        if (error) throw error; 
        
        return (data as Record<string, unknown>[]).map(item => mapToCamelCase<T>(item));
      },
      getKey: (item) => item.id as string,
      syncMode: 'eager',
      startSync: true,
      getOfflineData: async () => { return []; },
      
      // --- 2. THE CHOKE POINT: TRANSLATING BEFORE QUEUEING ---
      onInsert: async ({ transaction }) => {
        const items = transaction.mutations.map(m => mapToSnakeCase(m.modified));
        
        queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            const { error } = await supabase.from(tableName).insert(items);
            if (error) throw error;
          },
          networkMode: 'offlineFirst',
          retry: 3, 
        }).execute();
      },
      
      onUpdate: async ({ transaction }) => {
        queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            for (const m of transaction.mutations) {
              const snakeCaseChanges = mapToSnakeCase(m.changes);
              const { error } = await supabase.from(tableName).update(snakeCaseChanges).eq('id', m.key);
              if (error) throw error;
            }
          },
          networkMode: 'offlineFirst',
        }).execute();
      },
      
      onDelete: async ({ transaction }) => {
        const keys = transaction.mutations.map(m => m.key);
        
        queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            if (options.hasSoftDelete) {
              const { error } = await supabase.from(tableName).update({ is_deleted: true }).in('id', keys);
              if (error) throw error;
            } else {
              const { error } = await supabase.from(tableName).delete().in('id', keys);
              if (error) throw error;
            }
          },
          networkMode: 'offlineFirst',
        }).execute();
      }
    })
  );
};

export interface TanStackCollection<T> {
  insert: (item: T) => Promise<void>;
  update: (draft: T) => Promise<void>;
  delete: (id: string) => Promise<void>;
  getAll: () => Promise<T[]>;
}

// --- COLLECTION FACTORY ---
export const createStandardCollection = <T extends { id: string }>(tableName: string): TanStackCollection<T> => {
  const collection = baseCreateCollection<T, string>({
    queryKey: [tableName],
    queryClient,
    getKey: (item: T) => item.id,
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select('*').eq('is_deleted', false);
      if (error) throw error;
      return (data as T[]) || [];
    },
    onInsert: async (item: T) => {
      const { error } = await supabase.from(tableName).upsert([item as Record<string, unknown>]);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    onUpdate: async (id: string, draft: Partial<T>) => {
      const { error } = await supabase.from(tableName).update(draft as Record<string, unknown>).eq('id', id);
      if (error) throw new Error(`DB_SCHEMA_ERROR: ${error.message}`);
    },
    sync: { enabled: true }
  });

  const update = async (draft: T) => {
    await collection.update(draft.id, draft);
  };

  return {
    insert: collection.insert,
    update: update,
    delete: collection.delete,
    getAll: collection.queryFn
  };
};

// 1. Animals Collection
export const animalsCollection = createStandardCollection<Animal>('animals');

// 2. Daily Logs Collection (14-Day Offline Failover Compliant)
export const dailyLogsCollection = createFailoverCollection<LogEntry>('daily_logs');

// 3. Tasks Collection
export const tasksCollection = createStandardCollection<{ id: string; title: string; dueDate: string; completed: boolean; type: string; animalId: string; notes: string; }>('tasks');

// --- SETTINGS & USERS MODULES ---
export const usersCollection = createStandardCollection<{ id: string; name: string; email: string; role: string; }>('users');
export const orgSettingsCollection = createStandardCollection<{ id: string; key: string; value: string; }>('org_settings');
export const zlaDocumentsCollection = createStandardCollection<{ id: string; name: string; url: string; }>('zla_documents');
export const directoryCollection = createStandardCollection<{ id: string; name: string; category: string; }>('directory');

// --- MEDICAL & LOGISTICS MODULES ---
export const medicalLogsCollection = createStandardCollection<{ id: string; animalId: string; logType: string; logDate: string; value: string; }>('medical_logs');
export const marChartsCollection = createStandardCollection<{ id: string; animalId: string; noteType: string; }>('mar_charts');
export const quarantineRecordsCollection = createStandardCollection<{ id: string; animalId: string; startDate: string; }>('quarantine_records');
export const movementsCollection = createStandardCollection<{ id: string; animalId: string; from: string; to: string; }>('movements');
export const transfersCollection = createStandardCollection<{ id: string; animalId: string; from: string; to: string; }>('transfers');

// --- STAFF MODULES ---
export const timesheetsCollection = createStandardCollection<Timesheet>('timesheets');
export const rotaCollection = createStandardCollection<{ id: string; staffId: string; date: string; }>('rota');
export const holidaysCollection = createStandardCollection<{ id: string; staffId: string; date: string; }>('holidays');

// --- SAFETY MODULES ---
export const safetyDrillsCollection = createStandardCollection<{ id: string; title: string; date: string; }>('safety_drills');
export const incidentsCollection = createStandardCollection<{ id: string; title: string; date: string; }>('incidents');
export const maintenanceCollection = createStandardCollection<{ id: string; title: string; date: string; }>('maintenance');
export const firstAidCollection = createStandardCollection<{ id: string; title: string; date: string; }>('first_aid');
