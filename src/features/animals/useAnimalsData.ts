import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '../../lib/database';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const { data: animals = [], isLoading } = useLiveQuery((q) => q.from({ animals: animalsCollection }));

  const addAnimal = async (animal: Omit<Animal, 'id'>) => {
    return await animalsCollection.insert({ ...animal, id: crypto.randomUUID() });
  };

  const updateAnimal = async (animal: Animal) => {
    return await animalsCollection.update(animal.id, animal);
  };

  const filteredAnimals = animals.filter(animal => !animal.is_deleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal,
    updateAnimal
  };
};
