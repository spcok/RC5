import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '../../lib/database';

export function useAnimalProfileData(animalId: string | undefined) {
  const { data: animals = [], isLoading } = useLiveQuery(animalsCollection);
  
  const animal = animals.find(a => a.id === animalId);

  return { animal, isLoading };
}
