import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal } from '../../../types';

const birthSchema = z.object({
  litterSize: z.number().min(0, 'Litter size must be at least 0'),
  litterHealth: z.string().min(1, 'Health status is required'),
  notes: z.string().optional()
});

interface BirthFormProps {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function BirthForm({ animal, date, userInitials, existingLog, onSave, onCancel }: BirthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      litterSize: 0,
      litterHealth: 'Healthy',
      notes: existingLog?.notes || ''
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safePayload = birthSchema.parse(value);
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animal_id: animal.id,
          log_type: LogType.BIRTH,
          log_date: date,
          user_initials: userInitials,
          value: `Litter Size: ${safePayload.litterSize} (${safePayload.litterHealth})`,
          notes: safePayload.notes
        };
        await onSave(payload);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="litterSize" children={(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Litter Size</label>
            <input type="number" value={field.state.value} onChange={e => field.handleChange(parseInt(e.target.value) || 0)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" required />
          </div>
        )} />
        <form.Field name="litterHealth" children={(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Health Status</label>
            <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl" required>
              <option value="Healthy">Healthy</option>
              <option value="Complications">Complications</option>
              <option value="Stillborn">Stillborn</option>
            </select>
          </div>
        )} />
      </div>

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
