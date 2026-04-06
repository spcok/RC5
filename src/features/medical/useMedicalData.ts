import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

interface SupabaseMedicalLog {
  id: string;
  animal_id: string | null;
  animal_name: string | null;
  log_date: string | null;
  note_type: string | null;
  note_text: string | null;
  recheck_date: string | null;
  staff_initials: string | null;
  attachment_url: string | null;
  thumbnail_url: string | null;
  diagnosis: string | null;
  bcs: number | null;
  weight_grams: number | null;
  weight: number | null;
  weight_unit: string | null;
  treatment_plan: string | null;
  integrity_seal: string | null;
  updated_at: string;
  is_deleted: boolean;
  created_at: string;
}

interface SupabaseMARChart {
  id: string;
  animal_id: string | null;
  animal_name: string | null;
  medication: string | null;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  instructions: string | null;
  administered_dates: string[] | null;
  staff_initials: string | null;
  integrity_seal: string | null;
  updated_at: string;
  is_deleted: boolean;
  created_at: string;
}

interface SupabaseQuarantineRecord {
  id: string;
  animal_id: string | null;
  animal_name: string | null;
  reason: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  isolation_notes: string | null;
  staff_initials: string | null;
  updated_at: string;
  is_deleted: boolean;
  created_at: string;
}

export const useMedicalData = (animalId?: string) => {
  const queryClient = useQueryClient();

  // 1. FETCH CLINICAL NOTES
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useQuery<ClinicalNote[]>({
    queryKey: ['medical_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('medical_logs').select('*');
        if (error) throw error;
        
        const mappedData: ClinicalNote[] = (data as unknown as SupabaseMedicalLog[]).map((item: SupabaseMedicalLog) => ({
          id: item.id,
          animalId: item.animal_id,
          animalName: item.animal_name,
          date: item.log_date,
          noteType: item.note_type,
          noteText: item.note_text,
          recheckDate: item.recheck_date,
          staffInitials: item.staff_initials,
          attachmentUrl: item.attachment_url,
          thumbnailUrl: item.thumbnail_url,
          diagnosis: item.diagnosis,
          bcs: item.bcs,
          weightGrams: item.weight_grams,
          weight: item.weight,
          weightUnit: item.weight_unit,
          treatmentPlan: item.treatment_plan,
          integritySeal: item.integrity_seal,
          updatedAt: item.updated_at,
          isDeleted: item.is_deleted,
          createdAt: item.created_at
        }));

        for (const item of mappedData) {
          try {
            await medicalLogsCollection.update(item.id, () => item);
          } catch {
            await medicalLogsCollection.insert(item);
          }
        }
        return mappedData;
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
        
        const mappedData: MARChart[] = (data as unknown as SupabaseMARChart[]).map((item: SupabaseMARChart) => ({
          id: item.id,
          animalId: item.animal_id,
          animalName: item.animal_name,
          medication: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          startDate: item.start_date,
          endDate: item.end_date,
          status: item.status,
          instructions: item.instructions,
          administeredDates: item.administered_dates,
          staffInitials: item.staff_initials,
          integritySeal: item.integrity_seal,
          updatedAt: item.updated_at,
          isDeleted: item.is_deleted,
          createdAt: item.created_at
        }));

        for (const item of mappedData) {
          try {
            await marChartsCollection.update(item.id, () => item);
          } catch {
            await marChartsCollection.insert(item);
          }
        }
        return mappedData;
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
        
        const mappedData: QuarantineRecord[] = (data as unknown as SupabaseQuarantineRecord[]).map((item: SupabaseQuarantineRecord) => ({
          id: item.id,
          animalId: item.animal_id,
          animalName: item.animal_name,
          reason: item.reason,
          startDate: item.start_date,
          endDate: item.end_date,
          status: item.status,
          isolationNotes: item.isolation_notes,
          staffInitials: item.staff_initials,
          updatedAt: item.updated_at,
          isDeleted: item.is_deleted,
          createdAt: item.created_at
        }));

        for (const item of mappedData) {
          try {
            await quarantineRecordsCollection.update(item.id, () => item);
          } catch {
            await quarantineRecordsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving Quarantine Records from local vault.");
        return await quarantineRecordsCollection.getAll();
      }
    }
  });

  const clinicalNotes = useMemo(() => rawClinicalNotes.filter(n => !n.isDeleted && (!animalId || n.animalId === animalId)), [rawClinicalNotes, animalId]);
  const marCharts = useMemo(() => rawMarCharts.filter(m => !m.isDeleted && (!animalId || m.animalId === animalId)), [rawMarCharts, animalId]);
  const quarantineRecords = useMemo(() => rawQuarantineRecords.filter(q => !q.isDeleted && (!animalId || q.animalId === animalId)), [rawQuarantineRecords, animalId]);

  const addClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const supabasePayload = {
        id: note.id || crypto.randomUUID(),
        animal_id: note.animalId,
        animal_name: note.animalName,
        log_date: note.date,
        note_type: note.noteType,
        note_text: note.noteText,
        recheck_date: note.recheckDate,
        staff_initials: note.staffInitials,
        attachment_url: note.attachmentUrl,
        thumbnail_url: note.thumbnailUrl,
        diagnosis: note.diagnosis,
        bcs: note.bcs,
        weight_grams: note.weightGrams,
        weight: note.weight,
        weight_unit: note.weightUnit,
        treatment_plan: note.treatmentPlan,
        integrity_seal: note.integritySeal,
        created_at: new Date().toISOString(),
        is_deleted: false
      };

      try {
        const { error } = await supabase.from('medical_logs').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding clinical note locally.");
      }
      await medicalLogsCollection.insert(note as ClinicalNote);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical_records'] })
  });

  const updateClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      if (!note.id) throw new Error("Cannot update without an ID");
      
      const supabasePayload = {
        animal_id: note.animalId,
        animal_name: note.animalName,
        log_date: note.date,
        note_type: note.noteType,
        note_text: note.noteText,
        recheck_date: note.recheckDate,
        staff_initials: note.staffInitials,
        attachment_url: note.attachmentUrl,
        thumbnail_url: note.thumbnailUrl,
        diagnosis: note.diagnosis,
        bcs: note.bcs,
        weight_grams: note.weightGrams,
        weight: note.weight,
        weight_unit: note.weightUnit,
        treatment_plan: note.treatmentPlan,
        integrity_seal: note.integritySeal,
        updated_at: new Date().toISOString()
      };

      try {
        const { error } = await supabase.from('medical_logs').update(supabasePayload).eq('id', note.id);
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
      const supabasePayload = {
        id: chart.id || crypto.randomUUID(),
        animal_id: chart.animalId,
        animal_name: chart.animalName,
        medication: chart.medication,
        dosage: chart.dosage,
        frequency: chart.frequency,
        start_date: chart.startDate,
        end_date: chart.endDate,
        status: chart.status,
        instructions: chart.instructions,
        administered_dates: chart.administeredDates,
        staff_initials: chart.staffInitials,
        integrity_seal: chart.integritySeal,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { error } = await supabase.from('mar_charts').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding MAR chart locally.");
      }
      await marChartsCollection.insert(chart as MARChart);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mar_charts'] })
  });

  const addQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const supabasePayload = {
        id: record.id || crypto.randomUUID(),
        animal_id: record.animalId,
        animal_name: record.animalName,
        reason: record.reason,
        start_date: record.startDate,
        end_date: record.endDate,
        status: record.status,
        isolation_notes: record.isolationNotes,
        staff_initials: record.staffInitials,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      try {
        const { error } = await supabase.from('quarantine_records').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding quarantine record locally.");
      }
      await quarantineRecordsCollection.insert(record as QuarantineRecord);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  const updateQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      if (!record.id) throw new Error("Cannot update without an ID");
      
      const supabasePayload = {
        animal_id: record.animalId,
        animal_name: record.animalName,
        reason: record.reason,
        start_date: record.startDate,
        end_date: record.endDate,
        status: record.status,
        isolation_notes: record.isolationNotes,
        staff_initials: record.staffInitials,
        updated_at: new Date().toISOString()
      };

      try {
        const { error } = await supabase.from('quarantine_records').update(supabasePayload).eq('id', record.id);
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
