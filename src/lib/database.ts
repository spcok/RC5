import { createDatabase } from '@tanstack/db';
import { supabase } from './supabase';
import { z } from 'zod';

const FOURTEEN_DAYS_AGO = new Date();
FOURTEEN_DAYS_AGO.setDate(FOURTEEN_DAYS_AGO.getDate() - 14);
const dateString = FOURTEEN_DAYS_AGO.toISOString();

// Define schemas
const AnimalSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_deleted: z.boolean().default(false),
});

const DailyLogSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  animal_id: z.string(),
  log_type: z.string(),
});

const TaskSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  title: z.string(),
});

export const db = createDatabase({
  collections: {
    animals: {
      primaryKey: 'id',
      schema: AnimalSchema,
      sync: async () => {
         const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
         return data;
      }
    },
    daily_logs: {
      primaryKey: 'id',
      schema: DailyLogSchema,
      sync: async () => {
         const { data } = await supabase
           .from('daily_logs')
           .select('*')
           .gte('created_at', dateString);
         return data;
      }
    },
    tasks: {
      primaryKey: 'id',
      schema: TaskSchema,
      sync: async () => {
         const { data } = await supabase
           .from('tasks')
           .select('*')
           .gte('created_at', dateString);
         return data;
      }
    }
  }
});
