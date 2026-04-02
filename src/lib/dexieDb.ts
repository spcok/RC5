import Dexie, { Table } from 'dexie';
import { Animal, LogEntry, Task, OperationalList, InternalMovement } from '../types';

export class KOADatabase extends Dexie {
  animals!: Table<Animal>;
  daily_logs!: Table<LogEntry>;
  tasks!: Table<Task>;
  operational_lists!: Table<OperationalList>;
  movements!: Table<InternalMovement>;

  constructor() {
    super('KOA_Manager_DB');
    this.version(3).stores({
      animals: 'id, category',
      daily_logs: 'id, animal_id, log_date, log_type',
      tasks: 'id, status, type, completed',
      operational_lists: 'id, type, category',
      movements: 'id, animal_id, log_date'
    });
  }
}
export const db = new KOADatabase();
