import { supabase } from './supabase';
import { db } from './dexieDb';

export const syncShadowDatabase = async () => {
  if (!navigator.onLine) return;
  console.log('🔄 Running 30-Day Shadow Database Sync...');

  try {
    // 1. Sync Active Animals
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .select('*')
      .eq('is_deleted', false)
      .eq('archived', false);
    
    if (animalError) {
      console.error('⚠️ Failed to fetch animals for sync:', animalError);
    } else if (animals) {
      await db.animals.bulkPut(animals);
    }

    // 2. Sync 30-Day Logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .gte('log_date', dateStr)
      .eq('is_deleted', false);
    if (logs) await db.daily_logs.bulkPut(logs);

    // 3. Sync Tasks
    const { data: tasks } = await supabase.from('tasks').select('*').eq('is_deleted', false);
    if (tasks) await db.tasks.bulkPut(tasks);

    // 4. Sync Operational Lists
    const { data: operational_lists } = await supabase.from('operational_lists').select('*').eq('is_deleted', false);
    if (operational_lists) await db.operational_lists.bulkPut(operational_lists);

    // 5. Sync Movements
    const { data: movements } = await supabase.from('movements').select('*').eq('is_deleted', false);
    if (movements) await db.movements.bulkPut(movements);

    console.log('✅ 30-Day Shadow DB Sync Complete.');
  } catch (error) {
    console.error('⚠️ Shadow DB Sync Failed:', error);
  }
};
