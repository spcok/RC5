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

    // 6. Sync Daily Rounds
    const { data: daily_rounds } = await supabase.from('daily_rounds').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (daily_rounds) await db.daily_rounds.bulkPut(daily_rounds);

    // 7. Sync Medical Logs
    const { data: medical_logs } = await supabase.from('medical_logs').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (medical_logs) await db.medical_logs.bulkPut(medical_logs);

    // 8. Sync MAR Charts
    const { data: mar_charts } = await supabase.from('mar_charts').select('*').gte('start_date', dateStr).eq('is_deleted', false);
    if (mar_charts) await db.mar_charts.bulkPut(mar_charts);

    // 9. Sync Quarantine Records
    const { data: quarantine_records } = await supabase.from('quarantine_records').select('*').gte('start_date', dateStr).eq('is_deleted', false);
    if (quarantine_records) await db.quarantine_records.bulkPut(quarantine_records);

    // 10. Sync Transfers
    const { data: transfers } = await supabase.from('transfers').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (transfers) await db.transfers.bulkPut(transfers);

    // 11. Sync Incidents
    const { data: incidents } = await supabase.from('incidents').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (incidents) await db.incidents.bulkPut(incidents);

    // 12. Sync Maintenance
    const { data: maintenance } = await supabase.from('maintenance').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (maintenance) await db.maintenance.bulkPut(maintenance);

    // 13. Sync First Aid
    const { data: first_aid } = await supabase.from('first_aid').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (first_aid) await db.first_aid.bulkPut(first_aid);

    // 14. Sync Safety Drills
    const { data: safety_drills } = await supabase.from('safety_drills').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (safety_drills) await db.safety_drills.bulkPut(safety_drills);

    // 15. Sync Timesheets
    const { data: timesheets } = await supabase.from('timesheets').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (timesheets) await db.timesheets.bulkPut(timesheets);

    // 16. Sync Rota
    const { data: rota } = await supabase.from('rota').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (rota) await db.rota.bulkPut(rota);

    // 17. Sync Holidays
    const { data: holidays } = await supabase.from('holidays').select('*').gte('start_date', dateStr).eq('is_deleted', false);
    if (holidays) await db.holidays.bulkPut(holidays);

    // 18. Sync Missing Records
    const { data: missing_records } = await supabase.from('missing_records').select('*').gte('date', dateStr).eq('is_deleted', false);
    if (missing_records) await db.missing_records.bulkPut(missing_records);

    // 19. Sync Users
    const { data: users } = await supabase.from('users').select('*').eq('is_deleted', false);
    if (users) await db.users.bulkPut(users);

    // 20. Sync Org Settings
    const { data: org_settings } = await supabase.from('org_settings').select('*');
    if (org_settings) await db.org_settings.bulkPut(org_settings);

    // 21. Sync ZLA Documents
    const { data: zla_documents } = await supabase.from('zla_documents').select('*');
    if (zla_documents) await db.zla_documents.bulkPut(zla_documents);

    console.log('✅ 30-Day Shadow DB Sync Complete.');
  } catch (error) {
    console.error('⚠️ Shadow DB Sync Failed:', error);
  }
};
