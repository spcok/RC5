import { useLiveQuery } from '@tanstack/react-db';
import { timesheetsCollection } from '../../lib/database';
import { Timesheet } from '../../types';

export function useTimesheetData() {
  const { data: timesheets = [], isLoading } = useLiveQuery(timesheetsCollection);

  const clockIn = async (staff_name: string) => {
    const payload = {
      id: crypto.randomUUID(),
      staff_name,
      date: new Date().toISOString().split('T')[0],
      clock_in: new Date().toISOString(),
      status: 'Active' as const,
      is_deleted: false
    };
    await timesheetsCollection.insert(payload as Timesheet);
  };

  const clockOut = async (id: string) => {
    const existing = timesheets.find(t => t.id === id);
    if (existing) {
      await timesheetsCollection.update({
        ...existing,
        clock_out: new Date().toISOString(),
        status: 'Completed' as const
      });
    }
  };

  const addTimesheet = async (timesheet: Omit<Timesheet, 'id'>) => {
    const payload = { ...timesheet, id: crypto.randomUUID(), is_deleted: false };
    await timesheetsCollection.insert(payload as Timesheet);
  };

  const deleteTimesheet = async (id: string) => {
    const existing = timesheets.find(t => t.id === id);
    if (existing) {
      await timesheetsCollection.update({
        ...existing,
        is_deleted: true
      });
    }
  };

  return {
    timesheets: timesheets.filter(t => !t.is_deleted),
    isLoading,
    clockIn,
    clockOut,
    addTimesheet,
    deleteTimesheet,
  };
}
