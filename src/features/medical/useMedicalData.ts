import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const queryClient = useQueryClient();

  const { data: clinicalNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['medical_logs', animalId],
    queryFn: async () => {
      let query = supabase.from('medical_logs').select('*');
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(n => ({
        id: n.id,
        animalId: n.animal_id,
        animalName: n.animal_name,
        date: n.date,
        noteType: n.note_type,
        noteText: n.note_text,
        recheckDate: n.recheck_date,
        staffInitials: n.staff_initials,
        attachmentUrl: n.attachment_url,
        thumbnailUrl: n.thumbnail_url,
        diagnosis: n.diagnosis,
        bcs: n.bcs,
        weightGrams: n.weight_grams,
        weight: n.weight,
        weightUnit: n.weight_unit,
        treatmentPlan: n.treatment_plan,
        integritySeal: n.integrity_seal,
        updatedAt: n.updated_at,
        isDeleted: n.is_deleted,
        createdAt: n.created_at
      })) as ClinicalNote[];
    }
  });

  const { data: marCharts = [], isLoading: marLoading } = useQuery({
    queryKey: ['mar_charts', animalId],
    queryFn: async () => {
      let query = supabase.from('mar_charts').select('*');
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(m => ({
        id: m.id,
        animalId: m.animal_id,
        animalName: m.animal_name,
        medication: m.medication,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.start_date,
        endDate: m.end_date,
        status: m.status,
        instructions: m.instructions,
        administeredDates: m.administered_dates,
        staffInitials: m.staff_initials,
        integritySeal: m.integrity_seal,
        updatedAt: m.updated_at,
        isDeleted: m.is_deleted,
        createdAt: m.created_at
      })) as MARChart[];
    }
  });

  const { data: quarantineRecords = [], isLoading: quarantineLoading } = useQuery({
    queryKey: ['quarantine_records', animalId],
    queryFn: async () => {
      let query = supabase.from('quarantine_records').select('*');
      if (animalId) {
        query = query.eq('animal_id', animalId);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(q => ({
        id: q.id,
        animalId: q.animal_id,
        animalName: q.animal_name,
        reason: q.reason,
        startDate: q.start_date,
        endDate: q.end_date,
        status: q.status,
        isolationNotes: q.isolation_notes,
        staffInitials: q.staff_initials,
        updatedAt: q.updated_at,
        isDeleted: q.is_deleted,
        createdAt: q.created_at
      })) as QuarantineRecord[];
    }
  });

  const addClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const payload = {
        id: note.id || crypto.randomUUID(),
        animal_id: note.animalId,
        animal_name: note.animalName,
        date: note.date,
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
      const { data, error } = await supabase.from('medical_logs').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical_logs'] })
  });

  const addMarChartMutation = useMutation({
    mutationFn: async (chart: Partial<MARChart>) => {
      const payload = {
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
      const { data, error } = await supabase.from('mar_charts').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mar_charts'] })
  });

  const addQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const payload = {
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
      const { data, error } = await supabase.from('quarantine_records').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quarantine_records'] })
  });

  const updateClinicalNoteMutation = useMutation({
    mutationFn: async (note: Partial<ClinicalNote>) => {
      const payload: Record<string, unknown> = { ...note };
      // Map back to snake_case if fields are present
      if (note.animalId) payload.animal_id = note.animalId;
      if (note.animalName) payload.animal_name = note.animalName;
      if (note.noteType) payload.note_type = note.noteType;
      if (note.noteText) payload.note_text = note.noteText;
      if (note.recheckDate) payload.recheck_date = note.recheckDate;
      if (note.staffInitials) payload.staff_initials = note.staffInitials;
      if (note.attachmentUrl) payload.attachment_url = note.attachmentUrl;
      if (note.thumbnailUrl) payload.thumbnail_url = note.thumbnailUrl;
      if (note.weightGrams) payload.weight_grams = note.weightGrams;
      if (note.weightUnit) payload.weight_unit = note.weightUnit;
      if (note.treatmentPlan) payload.treatment_plan = note.treatmentPlan;
      if (note.integritySeal) payload.integrity_seal = note.integritySeal;
      if (note.isDeleted !== undefined) payload.is_deleted = note.isDeleted;

      const { data, error } = await supabase.from('medical_logs')
        .update(payload).eq('id', note.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical_logs'] })
  });

  const updateQuarantineRecordMutation = useMutation({
    mutationFn: async (record: Partial<QuarantineRecord>) => {
      const payload: Record<string, unknown> = { ...record };
      if (record.animalId) payload.animal_id = record.animalId;
      if (record.animalName) payload.animal_name = record.animalName;
      if (record.startDate) payload.start_date = record.startDate;
      if (record.endDate) payload.end_date = record.endDate;
      if (record.isolationNotes) payload.isolation_notes = record.isolationNotes;
      if (record.staffInitials) payload.staff_initials = record.staffInitials;
      if (record.isDeleted !== undefined) payload.is_deleted = record.isDeleted;

      const { data, error } = await supabase.from('quarantine_records')
        .update(payload).eq('id', record.id).select().single();
      if (error) throw error;
      return data;
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
    isOffline: false
  };
};
