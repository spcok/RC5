import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const queryClient = useQueryClient();

  // 1. FETCH CLINICAL NOTES
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useQuery<ClinicalNote[]>({
    queryKey: ['medical_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('medical_logs').select('*');
        if (error) throw error;
        data.forEach(item => medicalLogsCollection.update(item.id, () => item as ClinicalNote).catch(() => medicalLogsCollection.insert(item as ClinicalNote)));
        return data as ClinicalNote[];
      } catch {
        console.warn("Network unreachable. Serving Medical Records from local vault.");
        return await medicalLogsCollection.getAll();
      }
    }
  });

  // 2. FETCH MAR CHARTS
  const { data: rawMarCharts = [], isLoading: marLoading } = useQuery<MARChart[]>({
    queryKey: ['mar_charts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('mar_charts').select('*');
        if (error) throw error;
        data.forEach(item => marChartsCollection.update(item.id, () => item as MARChart).catch(() => marChartsCollection.insert(item as MARChart)));
        return data as MARChart[];
      } catch {
        console.warn("Network unreachable. Serving MAR Charts from local vault.");
        return await marChartsCollection.getAll();
      }
    }
  });

  // 3. FETCH QUARANTINE RECORDS
  const { data: rawQuarantineRecords = [], isLoading: quarantineLoading } = useQuery<QuarantineRecord[]>({
    queryKey: ['quarantine_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('quarantine_records').select('*');
        if (error) throw error;
        data.forEach(item => quarantineRecordsCollection.update(item.id, () => item as QuarantineRecord).catch(() => quarantineRecordsCollection.insert(item as QuarantineRecord)));
        return data as QuarantineRecord[];
      } catch {
        console.warn("Network unreachable. Serving Quarantine Records from local vault.");
        return await quarantineRecordsCollection.getAll();
      }
    }
  });

  const clinicalNotes = useMemo(() => rawClinicalNotes.filter(n => !n.is_deleted && (!animalId || n.animal_id === animalId)), [rawClinicalNotes, animalId]);
  const marCharts = useMemo(() => rawMarCharts.filter(m => !m.is_deleted && (!animalId || m.animal_id === animalId)), [rawMarCharts, animalId]);
  const quarantineRecords = useMemo(() => rawQuarantineRecords.filter(q => !q.is_deleted && (!animalId || q.animal_id === animalId)), [rawQuarantineRecords, animalId]);

  const addClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const payload: ClinicalNote = {
        id: note.id || crypto.randomUUID(),
        animal_id: note.animalId!,
        animal_name: note.animalName!,
        date: note.date!,
        note_type: note.noteType!,
        note_text: note.noteText!,
        recheck_date: note.recheckDate,
        staff_initials: note.staffInitials!,
        attachment_url: note.attachmentUrl,
        thumbnail_url: note.thumbnailUrl,
        diagnosis: note.diagnosis,
        bcs: note.bcs,
        weight_grams: note.weightGrams,
        weight: note.weight,
        weight_unit: note.weightUnit,
        treatment_plan: note.treatmentPlan,
        integrity_seal: note.integritySeal!,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { error } = await supabase.from('medical_logs').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding clinical note locally.");
      }
      await medicalLogsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const updateClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      if (!note.id) throw new Error("Cannot update without an ID");
      try {
        const { error } = await supabase.from('medical_logs').update(note).eq('id', note.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating clinical note locally.");
      }
      await medicalLogsCollection.update(note.id, (prev) => ({ ...prev, ...note }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const addMarChartMutation = useMutation({
    mutationFn: async (chart: Partial<MARChart>) => {
      const payload: MARChart = {
        id: chart.id || crypto.randomUUID(),
        animal_id: chart.animalId!,
        animal_name: chart.animalName!,
        medication: chart.medication!,
        dosage: chart.dosage!,
        frequency: chart.frequency!,
        start_date: chart.startDate!,
        end_date: chart.endDate,
        status: chart.status!,
        instructions: chart.instructions!,
        administered_dates: chart.administeredDates!,
        staff_initials: chart.staffInitials!,
        integrity_seal: chart.integritySeal!,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { error } = await supabase.from('mar_charts').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding MAR chart locally.");
      }
      await marChartsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mar_charts'] })
  });

  const addQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const payload: QuarantineRecord = {
        id: record.id || crypto.randomUUID(),
        animal_id: record.animalId!,
        animal_name: record.animalName!,
        reason: record.reason!,
        start_date: record.startDate!,
        end_date: record.endDate,
        status: record.status!,
        isolation_notes: record.isolationNotes!,
        staff_initials: record.staffInitials!,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { error } = await supabase.from('quarantine_records').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding quarantine record locally.");
      }
      await quarantineRecordsCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  const updateQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) throw new Error("Cannot update without an ID");
      try {
        const { error } = await supabase.from('quarantine_records').update(record).eq('id', record.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating quarantine record locally.");
      }
      await quarantineRecordsCollection.update(record.id, (prev) => ({ ...prev, ...record }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  return {
    clinicalNotes,
    marCharts,
    quarantineRecords,
    isLoading: notesLoading || marLoading || quarantineLoading,
    addClinicalNote: addClinicalNoteMutation.mutateAsync,
    updateClinicalNote: updateClinicalNoteMutation.mutateAsync,
    addMarChart: addMarChartMutation.mutateAsync,
    addQuarantineRecord: addQuarantineRecordMutation.mutateAsync,
    updateQuarantineRecord: updateQuarantineRecordMutation.mutateAsync,
    isMutating: addClinicalNoteMutation.isPending || updateClinicalNoteMutation.isPending || addMarChartMutation.isPending || addQuarantineRecordMutation.isPending || updateQuarantineRecordMutation.isPending
  };
};
