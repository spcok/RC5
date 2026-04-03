import { useLiveQuery } from '@tanstack/react-db';
import { medicalLogsCollection, marChartsCollection, quarantineRecordsCollection } from '../../lib/database';
import { ClinicalNote, MARChart, QuarantineRecord } from '../../types';

export const useMedicalData = (animalId?: string) => {
  const { data: rawClinicalNotes = [], isLoading: notesLoading } = useLiveQuery(medicalLogsCollection);
  const { data: rawMarCharts = [], isLoading: marLoading } = useLiveQuery(marChartsCollection);
  const { data: rawQuarantineRecords = [], isLoading: quarantineLoading } = useLiveQuery(quarantineRecordsCollection);

  const clinicalNotes = rawClinicalNotes.filter(n => !n.is_deleted && (!animalId || n.animal_id === animalId));
  const marCharts = rawMarCharts.filter(m => !m.is_deleted && (!animalId || m.animal_id === animalId));
  const quarantineRecords = rawQuarantineRecords.filter(q => !q.is_deleted && (!animalId || q.animal_id === animalId));

  const addClinicalNote = async (note: Partial<ClinicalNote>) => {
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
    await medicalLogsCollection.insert(payload as ClinicalNote);
  };

  const addMarChart = async (chart: Partial<MARChart>) => {
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
    await marChartsCollection.insert(payload as MARChart);
  };

  const addQuarantineRecord = async (record: Partial<QuarantineRecord>) => {
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
    await quarantineRecordsCollection.insert(payload as QuarantineRecord);
  };

  const updateClinicalNote = async (note: Partial<ClinicalNote>) => {
    const payload: Record<string, unknown> = { ...note };
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

    await medicalLogsCollection.update(payload as ClinicalNote);
  };

  const updateQuarantineRecord = async (record: Partial<QuarantineRecord>) => {
    const payload: Record<string, unknown> = { ...record };
    if (record.animalId) payload.animal_id = record.animalId;
    if (record.animalName) payload.animal_name = record.animalName;
    if (record.startDate) payload.start_date = record.startDate;
    if (record.endDate) payload.end_date = record.endDate;
    if (record.isolationNotes) payload.isolation_notes = record.isolationNotes;
    if (record.staffInitials) payload.staff_initials = record.staffInitials;
    if (record.isDeleted !== undefined) payload.is_deleted = record.isDeleted;

    await quarantineRecordsCollection.update(payload as QuarantineRecord);
  };

  return {
    clinicalNotes,
    marCharts,
    quarantineRecords,
    isLoading: notesLoading || marLoading || quarantineLoading,
    addClinicalNote,
    updateClinicalNote,
    addMarChart,
    addQuarantineRecord,
    updateQuarantineRecord,
    isOffline: false
  };
};
