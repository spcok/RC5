import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Transfer } from '../../types';

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transfers').select('*');
      if (error) throw error;
      return (data || []) as Transfer[];
    }
  });

  const addTransferMutation = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const { data, error } = await supabase.from('transfers').insert([transfer]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (transfer: Transfer) => {
      const { data, error } = await supabase.from('transfers').update(transfer).eq('id', transfer.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transfers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  return {
    transfers,
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync
  };
};
