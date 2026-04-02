import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ZLADocument } from '../../types';

export const useZLADocsData = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['zla_documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('zla_documents').select('*');
      if (error) throw error;
      return (data || []) as ZLADocument[];
    }
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (doc: Omit<ZLADocument, 'id'>) => {
      const { data, error } = await supabase.from('zla_documents').insert([doc]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zla_documents'] })
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('zla_documents').delete().eq('id', id);
      if (error) throw error;
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
