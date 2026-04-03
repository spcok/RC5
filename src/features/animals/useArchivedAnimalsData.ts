import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '../../lib/database';

export function useArchivedAnimalsData() {
  const { data: animals = [], isLoading } = useLiveQuery(animalsCollection);
  
  const archivedAnimals = animals.filter(a => a.is_deleted);

  return { archivedAnimals, isLoading, error: null };
}
