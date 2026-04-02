import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { Animal, QuarantineRecord } from '../../types';

const schema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  reason: z.string().min(1, 'Reason is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'Target release date is required'),
  isolationNotes: z.string().min(1, 'Notes are required'),
  staffInitials: z.string().min(2, 'Initials are required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<QuarantineRecord, 'id' | 'animalName' | 'status'>) => Promise<void>;
  animals: Animal[];
}

export const AddQuarantineModal: React.FC<Props> = ({ isOpen, onClose, onSave, animals }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: (() => {
        const now = new Date();
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      })(),
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    await onSave(data);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-slate-900">Add Quarantine Record</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Animal</label>
            <select {...register('animalId')} className="w-full mt-1 border border-slate-300 rounded-lg p-2">
              <option value="">Select an animal</option>
              {animals?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.animalId && <p className="text-red-500 text-xs">{errors.animalId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Reason</label>
            <input type="text" {...register('reason')} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
            {errors.reason && <p className="text-red-500 text-xs">{errors.reason.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date</label>
              <input type="date" {...register('startDate')} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
              {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Target Release</label>
              <input type="date" {...register('endDate')} className="w-full mt-1 border border-slate-300 rounded-lg p-2" />
              {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Isolation Notes</label>
            <textarea {...register('isolationNotes')} className="w-full mt-1 border border-slate-300 rounded-lg p-2" rows={3} />
            {errors.isolationNotes && <p className="text-red-500 text-xs">{errors.isolationNotes.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Staff Initials <span className="text-red-500">*</span></label>
            <input type="text" {...register('staffInitials')} className="w-full mt-1 border border-slate-300 rounded-lg p-2" required />
            {errors.staffInitials && <p className="text-red-500 text-xs">{errors.staffInitials.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:bg-slate-400">
            {isSubmitting ? 'Saving...' : 'Save Record'}
          </button>
        </form>
      </div>
    </div>
  );
};
