import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { Transfer } from '../../types';

export const useTransfersData = () => {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('transfers').select('*');
        if (error) throw error;
        if (data) await db.transfers.bulkPut(data);
        return (data || []) as Transfer[];
      } catch (err) {
        console.log('📡 Network offline. Reading Transfers from Dexie...', err);
        return await db.transfers.toArray();
      }
    }
  });

  const addTransferMutation = useMutation({
    mutationFn: async (transfer: Omit<Transfer, 'id'>) => {
      const payload = { ...transfer, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase.from('transfers').insert([payload]).select().single();
        if (error) throw error;
        await db.transfers.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Transfer locally...', err);
        await db.transfers.put(payload as Transfer);
        return payload as Transfer;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (transfer: Transfer) => {
      try {
        const { data, error } = await supabase.from('transfers').update(transfer).eq('id', transfer.id).select().single();
        if (error) throw error;
        await db.transfers.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Updating Transfer locally...', err);
        await db.transfers.put(transfer);
        return transfer;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('transfers').delete().eq('id', id);
        if (error) throw error;
        await db.transfers.delete(id);
      } catch (err) {
        console.log('📡 Network offline. Deleting Transfer locally...', err);
        await db.transfers.delete(id);
      }
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
