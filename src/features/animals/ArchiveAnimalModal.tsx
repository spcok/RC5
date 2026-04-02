import React, { useState } from 'react';
import { Animal } from '@/src/types';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal;
}

export const ArchiveAnimalModal: React.FC<Props> = ({ isOpen, onClose, animal }) => {
  const [archiveType, setArchiveType] = useState<string>('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const reason = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(', ');
    
    try {
      const { error } = await supabase.rpc('archive_sub_account', {
        p_animal_id: animal.id,
        p_archive_type: archiveType,
        p_archive_reason: reason,
        p_archive_date: new Date().toISOString(),
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['animals'] });
      navigate({ to: '/animals' });
      onClose();
    } catch (err: unknown) {
      console.error('Archive error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      window.alert(`Failed to archive animal: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    switch (archiveType) {
      case 'Disposition':
        return (
          <>
            <input className="w-full p-2 border rounded" placeholder="Destination Institution" onChange={(e) => setFields({...fields, destination: e.target.value})} />
            <input className="w-full p-2 border rounded" type="date" onChange={(e) => setFields({...fields, date: e.target.value})} />
            <textarea className="w-full p-2 border rounded" placeholder="Notes" onChange={(e) => setFields({...fields, notes: e.target.value})} />
          </>
        );
      case 'Euthanasia':
        return (
          <>
            <input className="w-full p-2 border rounded" placeholder="Authorizing Vet" onChange={(e) => setFields({...fields, vet: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Medical Justification" onChange={(e) => setFields({...fields, justification: e.target.value})} />
            <input className="w-full p-2 border rounded" type="date" onChange={(e) => setFields({...fields, date: e.target.value})} />
          </>
        );
      case 'Death':
        return (
          <>
            <input className="w-full p-2 border rounded" placeholder="Suspected Cause" onChange={(e) => setFields({...fields, cause: e.target.value})} />
            <select className="w-full p-2 border rounded" onChange={(e) => setFields({...fields, necropsy: e.target.value})}>
              <option value="">Necropsy Required?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <input className="w-full p-2 border rounded" type="date" onChange={(e) => setFields({...fields, date: e.target.value})} />
          </>
        );
      case 'Missing':
      case 'Stolen':
        return (
          <>
            <input className="w-full p-2 border rounded" type="date" onChange={(e) => setFields({...fields, date: e.target.value})} />
            <textarea className="w-full p-2 border rounded" placeholder="Notes" onChange={(e) => setFields({...fields, notes: e.target.value})} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-4">Archive {animal.name}</h2>
        <select className="w-full mb-4 p-2 border rounded" onChange={(e) => { setArchiveType(e.target.value); setFields({}); }} value={archiveType}>
          <option value="">Select Archive Type</option>
          <option value="Disposition">Disposition</option>
          <option value="Death">Death</option>
          <option value="Euthanasia">Euthanasia</option>
          <option value="Missing">Missing</option>
          <option value="Stolen">Stolen</option>
        </select>
        <div className="flex flex-col gap-2 mb-4">
          {renderFields()}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded" disabled={isSubmitting}>Cancel</button>
          <button onClick={handleConfirm} disabled={!archiveType || isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">
            {isSubmitting ? 'Archiving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};
