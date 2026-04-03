import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Save, Loader2, CloudSun } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal } from '../../../types';

const tempSchema = z.object({
  temperature_c: z.number().nullable().optional(),
  basking_temp_c: z.number().nullable().optional(),
  cool_temp_c: z.number().nullable().optional(),
  notes: z.string().optional()
});

interface TemperatureFormProps {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function TemperatureForm({ animal, date, userInitials, existingLog, onSave, onCancel }: TemperatureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const form = useForm({
    defaultValues: {
      temperature_c: existingLog?.temperature_c || null,
      basking_temp_c: existingLog?.basking_temp_c || null,
      cool_temp_c: existingLog?.cool_temp_c || null,
      notes: existingLog?.notes || ''
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safePayload = tempSchema.parse({
          temperature_c: value.temperature_c === null ? undefined : value.temperature_c,
          basking_temp_c: value.basking_temp_c === null ? undefined : value.basking_temp_c,
          cool_temp_c: value.cool_temp_c === null ? undefined : value.cool_temp_c,
          notes: value.notes
        });
        
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animal_id: animal.id,
          log_type: LogType.TEMPERATURE,
          log_date: date,
          user_initials: userInitials,
          ...safePayload,
          value: `${safePayload.temperature_c || 0}°C`,
        };
        await onSave(payload);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleFetchWeather = async () => {
    setIsFetching(true);
    // Mock weather fetch logic
    setTimeout(() => {
      form.setFieldValue('temperature_c', 22);
      setIsFetching(false);
    }, 1000);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form.Field name="temperature_c" children={(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ambient Temp (°C)</label>
            <input type="number" value={field.state.value ?? ''} onChange={e => field.handleChange(e.target.value === '' ? null : parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" />
          </div>
        )} />
        <button type="button" onClick={handleFetchWeather} className="mt-6 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-slate-200">
          {isFetching ? <Loader2 size={16} className="animate-spin" /> : <CloudSun size={16} />} Fetch Weather
        </button>
      </div>

      {animal.category === 'EXOTICS' && (
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="basking_temp_c" children={(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Basking Temp (°C)</label>
              <input type="number" value={field.state.value ?? ''} onChange={e => field.handleChange(e.target.value === '' ? null : parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" />
            </div>
          )} />
          <form.Field name="cool_temp_c" children={(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cool Temp (°C)</label>
              <input type="number" value={field.state.value ?? ''} onChange={e => field.handleChange(e.target.value === '' ? null : parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" />
            </div>
          )} />
        </div>
      )}

      <form.Field name="notes" children={(field) => (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
          <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" />
        </div>
      )} />
      
      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-white border-2 text-slate-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>
    </form>
  );
}
