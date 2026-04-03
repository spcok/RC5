import { useLiveQuery } from '@tanstack/react-db';
import { movementsCollection } from '../../lib/database';
import { InternalMovement } from '../../types';

export const useMovementsData = () => {
  const { data: movements = [], isLoading } = useLiveQuery(movementsCollection);

  const addMovement = async (movement: Partial<InternalMovement>) => {
    const payload = {
      ...movement,
      id: movement.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_deleted: false
    };
    await movementsCollection.insert(payload as InternalMovement);
    return payload;
  };

  return { 
    movements: movements.filter(m => !m.is_deleted), 
    isLoading, 
    addMovement,
    isOffline: false
  };
};
