import { useQuery } from '@tanstack/react-query';
import { animalsCollection } from '../../lib/database';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      return await animalsCollection.query().all();
    }
  });

  const addAnimal = async (animal: Omit<Animal, 'id'>) => {
    return await animalsCollection.insert({ ...animal, id: crypto.randomUUID() } as Animal);
  };

  const updateAnimal = async (animal: Animal) => {
    const existing = animals.find(a => a.id === animal.id);
    if (existing) {
      return await animalsCollection.update({ ...existing, ...animal });
    }
  };

  const filteredAnimals = animals.filter(animal => !animal.is_deleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal,
    updateAnimal
  };
};
