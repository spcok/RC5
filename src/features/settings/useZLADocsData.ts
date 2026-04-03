import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { ZLADocument } from '../../types';

export const useZLADocsData = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['zla_documents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('zla_documents').select('*');
        if (error) throw error;
        if (data) await db.zla_documents.bulkPut(data);
        return (data || []) as ZLADocument[];
      } catch (err) {
        console.log('📡 Network offline. Reading ZLA Docs from Dexie...', err);
        return await db.zla_documents.toArray();
      }
    }
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (doc: Omit<ZLADocument, 'id'>) => {
      const payload = { ...doc, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase.from('zla_documents').insert([payload]).select().single();
        if (error) throw error;
        await db.zla_documents.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving ZLA Doc locally...', err);
        await db.zla_documents.put(payload as ZLADocument);
        return payload as ZLADocument;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('zla_documents').delete().eq('id', id);
        if (error) throw error;
        await db.zla_documents.delete(id);
      } catch (err) {
        console.log('📡 Network offline. Deleting ZLA Doc locally...', err);
        await db.zla_documents.delete(id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  return {
    documents,
    isLoading,
    addDocument: addDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync
  };
};
