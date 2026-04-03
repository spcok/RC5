import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal, OperationalList } from '../../../types';

interface FeedFormProps {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  foodTypes: OperationalList[];
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function FeedForm({ animal, date, userInitials, existingLog, foodTypes, onSave, onCancel }: FeedFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedItems, setFeedItems] = useState<{ type: string; quantity: string }[]>(() => {
    if (existingLog?.value) {
      return existingLog.value.split(', ').map(item => {
        const [type, quantity] = item.split(' - ');
        return { type: type || '', quantity: quantity || '' };
      });
    }
    return [{ type: '', quantity: '' }];
  });
  const [cast, setCast] = useState(() => {
    try { return existingLog?.notes ? JSON.parse(existingLog.notes).cast : ''; } catch { return ''; }
  });
  const [feedTime, setFeedTime] = useState(() => {
    try { return existingLog?.notes ? JSON.parse(existingLog.notes).feedTime : ''; } catch { return ''; }
  });

  const form = useForm({
    defaultValues: {
      userNotes: existingLog?.notes ? (JSON.parse(existingLog.notes).userNotes || '') : ''
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const safeNotes = z.string().optional().parse(value.userNotes);
        const finalValue = feedItems.map(item => `${item.type} - ${item.quantity}`).join(', ');
        
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animal_id: animal.id,
          log_type: LogType.FEED,
          log_date: date,
          user_initials: userInitials,
          value: finalValue,
          notes: JSON.stringify({ cast, feedTime, userNotes: safeNotes || '' })
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
      <div className="space-y-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Feed Items</label>
        {feedItems.map((item, index) => (
          <div key={index} className="flex gap-2">
            <select value={item.type} onChange={e => {
              const newItems = [...feedItems];
              newItems[index].type = e.target.value;
              setFeedItems(newItems);
            }} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
              <option value="">Select Food</option>
              {foodTypes.map(f => <option key={f.id} value={f.value}>{f.value}</option>)}
            </select>
            <input type="text" value={item.quantity} onChange={e => {
              const newItems = [...feedItems];
              newItems[index].quantity = e.target.value;
              setFeedItems(newItems);
            }} placeholder="Qty" className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            <button type="button" onClick={() => setFeedItems(feedItems.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setFeedItems([...feedItems, { type: '', quantity: '' }])} className="text-xs font-bold text-blue-600 flex items-center gap-1">
          <Plus size={14} /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cast</label>
          <input type="text" value={cast} onChange={e => setCast(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Time</label>
          <input type="time" value={feedTime} onChange={e => setFeedTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>

      <form.Field name="userNotes" children={(field) => (
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
