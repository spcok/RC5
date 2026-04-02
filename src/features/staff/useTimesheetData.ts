import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { Timesheet } from '../../types';

export function useTimesheetData() {
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('timesheets')
          .select('*')
          .eq('is_deleted', false);
        if (error) throw error;
        if (data) await db.timesheets.bulkPut(data);
        return data as Timesheet[];
      } catch (err) {
        console.log('📡 Network offline. Reading Timesheets from Dexie...', err);
        return await db.timesheets.where('is_deleted').equals(false).toArray();
      }
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (staff_name: string) => {
      const payload = {
        id: crypto.randomUUID(),
        staff_name,
        date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString(),
        status: 'Active' as const,
        is_deleted: false
      };
      try {
        const { data, error } = await supabase
          .from('timesheets')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        await db.timesheets.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Timesheet locally...', err);
        await db.timesheets.put(payload as Timesheet);
        return payload as Timesheet;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  const clockOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const update = { clock_out: new Date().toISOString(), status: 'Completed' as const };
      try {
        const { data, error } = await supabase
          .from('timesheets')
          .update(update)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await db.timesheets.update(id, update);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Updating Timesheet locally...', err);
        await db.timesheets.update(id, update);
        return { id, ...update } as Timesheet;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (timesheet: Omit<Timesheet, 'id'>) => {
      const payload = { ...timesheet, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase
          .from('timesheets')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        await db.timesheets.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Timesheet locally...', err);
        await db.timesheets.put(payload as Timesheet);
        return payload as Timesheet;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('timesheets')
          .update({ is_deleted: true })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await db.timesheets.update(id, { is_deleted: true });
        return data;
      } catch (err) {
        console.log('📡 Network offline. Deleting Timesheet locally...', err);
        await db.timesheets.update(id, { is_deleted: true });
        return { id } as Timesheet;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  return {
    timesheets,
    isLoading,
    clockIn: clockInMutation.mutateAsync,
    clockOut: clockOutMutation.mutateAsync,
    addTimesheet: addTimesheetMutation.mutateAsync,
    deleteTimesheet: deleteTimesheetMutation.mutateAsync,
  };
}
