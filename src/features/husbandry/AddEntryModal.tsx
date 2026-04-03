import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { X } from 'lucide-react';
import { Animal, LogType, LogEntry } from '../../types';
import { useForm } from '@tanstack/react-form';
import WeightForm from './forms/WeightForm';
import FeedForm from './forms/FeedForm';
import TemperatureForm from './forms/TemperatureForm';
import BirthForm from './forms/BirthForm';
import StandardForm from './forms/StandardForm';
import { useOperationalLists } from '../../hooks/useOperationalLists';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<LogEntry>) => Promise<void> | void;
  animal: Animal;
  initialType: LogType;
  existingLog?: LogEntry;
  initialDate: string;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  animal,
  initialType,
  existingLog,
  initialDate,
}) => {
  const { currentUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const { foodTypes, eventTypes } = useOperationalLists();

  const form = useForm({
    defaultValues: {
      date: initialDate,
      logType: initialType,
    },
  });

  if (!isOpen || !animal) return null;

  const handleSave = async (entry: Partial<LogEntry>) => {
    try {
      await onSave(entry);
      onClose();
    } catch {
      setError('An error occurred while saving.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {existingLog ? 'Edit' : 'Add'} {form.state.values.logType}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="date" children={(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date</label>
                <input type="date" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-xs" required />
              </div>
            )} />
            <form.Field name="logType" children={(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                <select value={field.state.value} onChange={e => field.handleChange(e.target.value as LogType)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-xs">
                  {Object.values(LogType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            )} />
          </div>

          {form.state.values.logType === LogType.WEIGHT && (
            <WeightForm
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}

          {form.state.values.logType === LogType.FEED && (
            <FeedForm
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              foodTypes={foodTypes}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}

          {form.state.values.logType === LogType.TEMPERATURE && (
            <TemperatureForm
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}

          {form.state.values.logType === LogType.EVENT && (
            <StandardForm
              logType={LogType.EVENT}
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              eventTypes={eventTypes}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}

          {form.state.values.logType === LogType.HEALTH && (
            <StandardForm
              logType={LogType.HEALTH}
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}

          {form.state.values.logType === LogType.BIRTH && (
            <BirthForm
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}

          {[LogType.MISTING, LogType.WATER, LogType.GENERAL].includes(form.state.values.logType) && (
            <StandardForm
              logType={form.state.values.logType}
              animal={animal}
              date={form.state.values.date}
              userInitials={currentUser?.initials.toUpperCase() || ''}
              existingLog={existingLog}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;
