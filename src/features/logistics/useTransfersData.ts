import { useLiveQuery } from '@tanstack/react-db';
import { transfersCollection } from '../../lib/database';
import { Transfer } from '../../types';

export const useTransfersData = () => {
  const { data: transfers = [], isLoading } = useLiveQuery(transfersCollection);

  const addTransfer = async (transfer: Omit<Transfer, 'id'>) => {
    const payload = { ...transfer, id: crypto.randomUUID() };
    await transfersCollection.insert(payload as Transfer);
    return payload;
  };

  const updateTransfer = async (transfer: Transfer) => {
    const existing = transfers.find(t => t.id === transfer.id);
    if (existing) {
      await transfersCollection.update({ ...existing, ...transfer });
      return transfer;
    }
  };

  const deleteTransfer = async (id: string) => {
    const existing = transfers.find(t => t.id === id);
    if (existing) {
      await transfersCollection.update({ ...existing, is_deleted: true });
    }
  };

  return {
    transfers: transfers.filter(t => !t.is_deleted),
    isLoading,
    addTransfer,
    updateTransfer,
    deleteTransfer
  };
};
