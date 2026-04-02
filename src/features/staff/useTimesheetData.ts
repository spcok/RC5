import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Timesheet } from '../../types';

export function useTimesheetData() {
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('is_deleted', false);
      if (error) throw error;
      return data as Timesheet[];
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (staff_name: string) => {
      const { data, error } = await supabase
        .from('timesheets')
        .insert([{ 
          staff_name, 
          date: new Date().toISOString().split('T')[0],
          clock_in: new Date().toISOString(), 
          status: 'Active',
          is_deleted: false
        }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  const clockOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('timesheets')
        .update({ clock_out: new Date().toISOString(), status: 'Completed' })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (timesheet: Omit<Timesheet, 'id'>) => {
      const { data, error } = await supabase
        .from('timesheets')
        .insert([timesheet])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
  });

  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('timesheets')
        .update({ is_deleted: true })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
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
