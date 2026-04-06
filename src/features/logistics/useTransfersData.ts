import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Transfer } from '../../types';

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('transfers').select('*');
        if (error) throw error;
        data.forEach(item => transfersCollection.update(item.id, () => item as Transfer).catch(() => transfersCollection.insert(item as Transfer)));
        return data as Transfer[];
      } catch {
        console.warn("Network unreachable. Serving transfers from local vault.");
        return await transfersCollection.getAll();
      }
    }
  });

  const addTransferMutation = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const payload: Transfer = { ...transfer, id: crypto.randomUUID() } as Transfer;
      try {
        const { error } = await supabase.from('transfers').insert([payload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding transfer locally.");
      }
      await transfersCollection.insert(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (transfer: Transfer) => {
      try {
        const { error } = await supabase.from('transfers').update(transfer).eq('id', transfer.id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating transfer locally.");
      }
      await transfersCollection.update(transfer.id, (prev) => ({ ...prev, ...transfer }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('transfers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting transfer locally.");
      }
      await transfersCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  return {
    transfers: transfers.filter(t => !t.is_deleted),
    isLoading,
    addTransfer: addTransferMutation.mutateAsync,
    updateTransfer: updateTransferMutation.mutateAsync,
    deleteTransfer: deleteTransferMutation.mutateAsync,
    isMutating: addTransferMutation.isPending || updateTransferMutation.isPending || deleteTransferMutation.isPending
  };
};
