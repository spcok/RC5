import { useLiveQuery } from '@tanstack/db';
import { db } from '../../lib/database';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const { data: animals = [], isLoading } = useLiveQuery({
    queryKey: ['animals'],
    queryFn: () => db.animals.findMany({}),
  });

  const addAnimal = async (animal: Omit<Animal, 'id'>) => {
    return await db.animals.insert({ ...animal, id: crypto.randomUUID() });
  };

  const updateAnimal = async (animal: Animal) => {
    return await db.animals.update(animal.id, animal);
  };

  const filteredAnimals = animals.filter(animal => !animal.is_deleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal,
    updateAnimal
  };
};
