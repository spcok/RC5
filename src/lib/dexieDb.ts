import Dexie, { Table } from 'dexie';
import { Animal, LogEntry, Task, OperationalList, InternalMovement, DailyRound, ClinicalNote, MARChart, QuarantineRecord, Transfer, Incident, MaintenanceLog, FirstAidLog, SafetyDrill, Timesheet, Shift, Holiday, MissingRecord, User, OrgProfileSettings, ZLADocument } from '../types';

export class KOADatabase extends Dexie {
  animals!: Table<Animal>;
  daily_logs!: Table<LogEntry>;
  tasks!: Table<Task>;
  operational_lists!: Table<OperationalList>;
  movements!: Table<InternalMovement>;
  daily_rounds!: Table<DailyRound>;
  medical_logs!: Table<ClinicalNote>;
  mar_charts!: Table<MARChart>;
  quarantine_records!: Table<QuarantineRecord>;
  transfers!: Table<Transfer>;
  incidents!: Table<Incident>;
  maintenance!: Table<MaintenanceLog>;
  first_aid!: Table<FirstAidLog>;
  safety_drills!: Table<SafetyDrill>;
  timesheets!: Table<Timesheet>;
  rota!: Table<Shift>;
  holidays!: Table<Holiday>;
  missing_records!: Table<MissingRecord>;
  users!: Table<User>;
  org_settings!: Table<OrgProfileSettings>;
  zla_documents!: Table<ZLADocument>;

  constructor() {
    super('KOA_Manager_DB');
    this.version(7).stores({
      animals: 'id, category',
      daily_logs: 'id, animal_id, log_date, log_type',
      tasks: 'id, status, type, completed',
      operational_lists: 'id, type, category',
      movements: 'id, animal_id, log_date',
      daily_rounds: 'id, date, shift, section',
      medical_logs: 'id, animal_id, date',
      mar_charts: 'id, animal_id, start_date',
      quarantine_records: 'id, animal_id, start_date',
      transfers: 'id, animal_id, date',
      incidents: 'id, date, status',
      maintenance: 'id, date, status',
      first_aid: 'id, date',
      safety_drills: 'id, date',
      timesheets: 'id, user_id, date',
      rota: 'id, user_id, date',
      holidays: 'id, user_id, start_date',
      missing_records: 'id, date',
      users: 'id, email, role',
      org_settings: 'id',
      zla_documents: 'id, category'
    });
  }
}
export const db = new KOADatabase();
