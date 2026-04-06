import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types';

interface SupabaseAnimal {
  id: string;
  entity_type: string;
  parent_mob_id: string | null;
  census_count: number | null;
  name: string;
  species: string;
  latin_name: string | null;
  category: string;
  location: string | null;
  image_url: string | null;
  hazard_rating: string | null;
  is_venomous: boolean | null;
  weight_unit: string | null;
  dob: string | null;
  is_dob_unknown: boolean | null;
  sex: string | null;
  microchip_id: string | null;
  disposition_status: string | null;
  origin_location: string | null;
  destination_location: string | null;
  transfer_date: string | null;
  ring_number: string | null;
  has_no_id: boolean | null;
  red_list_status: string | null;
  description: string | null;
  special_requirements: string | null;
  critical_husbandry_notes: string[] | null;
  target_day_temp_c: number | null;
  target_night_temp_c: number | null;
  target_humidity_min_percent: number | null;
  target_humidity_max_percent: number | null;
  misting_frequency: string | null;
  acquisition_date: string | null;
  origin: string | null;
  sire_id: string | null;
  dam_id: string | null;
  flying_weight_g: number | null;
  winter_weight_g: number | null;
  display_order: number | null;
  archived: boolean | null;
  archive_reason: string | null;
  archived_at: string | null;
  archive_type: string | null;
  date_of_death: string | null;
  disposition_date: string | null;
  is_quarantine: boolean | null;
  distribution_map_url: string | null;
  water_tipping_temp: number | null;
  ambient_temp_only: boolean | null;
  acquisition_type: string | null;
  is_boarding: boolean | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export const useAnimalsData = () => {
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*');
        if (error) throw error;

        const mappedData: Animal[] = (data as unknown as SupabaseAnimal[]).map((item: SupabaseAnimal) => ({
          id: item.id,
          entityType: (item.entity_type as EntityType) || null,
          parentMobId: item.parent_mob_id,
          censusCount: item.census_count,
          name: item.name,
          species: item.species,
          latinName: item.latin_name,
          category: (item.category as AnimalCategory),
          location: item.location || 'Unknown',
          imageUrl: item.image_url || undefined,
          hazardRating: (item.hazard_rating as HazardRating) || HazardRating.LOW,
          isVenomous: item.is_venomous || false,
          weightUnit: (item.weight_unit as 'g' | 'oz' | 'lbs_oz' | 'kg') || 'g',
          dob: item.dob || undefined,
          isDobUnknown: item.is_dob_unknown || false,
          sex: (item.sex as 'Male' | 'Female' | 'Unknown') || 'Unknown',
          microchipId: item.microchip_id || undefined,
          dispositionStatus: (item.disposition_status as 'Active' | 'Transferred' | 'Deceased' | 'Missing' | 'Stolen') || 'Active',
          originLocation: item.origin_location || undefined,
          destinationLocation: item.destination_location || undefined,
          transferDate: item.transfer_date || undefined,
          ringNumber: item.ring_number || undefined,
          hasNoId: item.has_no_id || false,
          redListStatus: (item.red_list_status as ConservationStatus) || undefined,
          description: item.description || undefined,
          specialRequirements: item.special_requirements || undefined,
          criticalHusbandryNotes: item.critical_husbandry_notes || undefined,
          targetDayTempC: item.target_day_temp_c || undefined,
          targetNightTempC: item.target_night_temp_c || undefined,
          targetHumidityMinPercent: item.target_humidity_min_percent || undefined,
          targetHumidityMaxPercent: item.target_humidity_max_percent || undefined,
          mistingFrequency: item.misting_frequency || undefined,
          acquisitionDate: item.acquisition_date || undefined,
          origin: item.origin || undefined,
          sireId: item.sire_id || undefined,
          damId: item.dam_id || undefined,
          flyingWeightG: item.flying_weight_g || undefined,
          winterWeightG: item.winter_weight_g || undefined,
          displayOrder: item.display_order || undefined,
          archived: item.archived || false,
          archiveReason: item.archive_reason || undefined,
          archivedAt: item.archived_at || undefined,
          archiveType: (item.archive_type as 'Disposition' | 'Death' | 'Euthanasia' | 'Missing' | 'Stolen') || undefined,
          dateOfDeath: item.date_of_death,
          dispositionDate: item.disposition_date,
          isQuarantine: item.is_quarantine || false,
          distributionMapUrl: item.distribution_map_url || undefined,
          waterTippingTemp: item.water_tipping_temp || undefined,
          ambientTempOnly: item.ambient_temp_only || false,
          acquisitionType: (item.acquisition_type as 'BORN' | 'TRANSFERRED_IN' | 'RESCUE' | 'UNKNOWN') || 'UNKNOWN',
          isBoarding: item.is_boarding || false,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          isDeleted: item.is_deleted
        }));

        for (const item of mappedData) {
          try {
            await animalsCollection.update(item.id, () => item);
          } catch {
            await animalsCollection.insert(item);
          }
        }
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving animals from local vault.");
        return await animalsCollection.query().all();
      }
    }
  });

  const addAnimalMutation = useMutation({
    mutationFn: async (animal: Omit<Animal, 'id'>) => {
      const id = crypto.randomUUID();
      const supabasePayload = {
        id,
        entity_type: animal.entityType,
        parent_mob_id: animal.parentMobId,
        census_count: animal.censusCount,
        name: animal.name,
        species: animal.species,
        latin_name: animal.latinName,
        category: animal.category,
        location: animal.location,
        image_url: animal.imageUrl,
        hazard_rating: animal.hazardRating,
        is_venomous: animal.isVenomous,
        weight_unit: animal.weightUnit,
        dob: animal.dob,
        is_dob_unknown: animal.isDobUnknown,
        sex: animal.sex,
        microchip_id: animal.microchipId,
        disposition_status: animal.dispositionStatus,
        origin_location: animal.originLocation,
        destination_location: animal.destinationLocation,
        transfer_date: animal.transferDate,
        ring_number: animal.ringNumber,
        has_no_id: animal.hasNoId,
        red_list_status: animal.redListStatus,
        description: animal.description,
        special_requirements: animal.specialRequirements,
        critical_husbandry_notes: animal.criticalHusbandryNotes,
        target_day_temp_c: animal.targetDayTempC,
        target_night_temp_c: animal.targetNightTempC,
        target_humidity_min_percent: animal.targetHumidityMinPercent,
        target_humidity_max_percent: animal.targetHumidityMaxPercent,
        misting_frequency: animal.mistingFrequency,
        acquisition_date: animal.acquisitionDate,
        origin: animal.origin,
        sire_id: animal.sireId,
        dam_id: animal.damId,
        flying_weight_g: animal.flyingWeightG,
        winter_weight_g: animal.winterWeightG,
        display_order: animal.displayOrder,
        archived: animal.archived,
        archive_reason: animal.archiveReason,
        archived_at: animal.archivedAt,
        archive_type: animal.archiveType,
        date_of_death: animal.dateOfDeath,
        disposition_date: animal.dispositionDate,
        is_quarantine: animal.isQuarantine,
        distribution_map_url: animal.distributionMapUrl,
        water_tipping_temp: animal.waterTippingTemp,
        ambient_temp_only: animal.ambientTempOnly,
        acquisition_type: animal.acquisitionType,
        is_boarding: animal.isBoarding,
        created_at: animal.createdAt,
        updated_at: animal.updatedAt,
        is_deleted: animal.isDeleted
      };
      
      const { error } = await supabase.from('animals').insert([supabasePayload]);
      if (error) throw error;
      
      await animalsCollection.insert({ ...animal, id } as Animal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] })
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async (animal: Animal) => {
      const supabasePayload = {
        entity_type: animal.entityType,
        parent_mob_id: animal.parentMobId,
        census_count: animal.censusCount,
        name: animal.name,
        species: animal.species,
        latin_name: animal.latinName,
        category: animal.category,
        location: animal.location,
        image_url: animal.imageUrl,
        hazard_rating: animal.hazardRating,
        is_venomous: animal.isVenomous,
        weight_unit: animal.weightUnit,
        dob: animal.dob,
        is_dob_unknown: animal.isDobUnknown,
        sex: animal.sex,
        microchip_id: animal.microchipId,
        disposition_status: animal.dispositionStatus,
        origin_location: animal.originLocation,
        destination_location: animal.destinationLocation,
        transfer_date: animal.transferDate,
        ring_number: animal.ringNumber,
        has_no_id: animal.hasNoId,
        red_list_status: animal.redListStatus,
        description: animal.description,
        special_requirements: animal.specialRequirements,
        critical_husbandry_notes: animal.criticalHusbandryNotes,
        target_day_temp_c: animal.targetDayTempC,
        target_night_temp_c: animal.targetNightTempC,
        target_humidity_min_percent: animal.targetHumidityMinPercent,
        target_humidity_max_percent: animal.targetHumidityMaxPercent,
        misting_frequency: animal.mistingFrequency,
        acquisition_date: animal.acquisitionDate,
        origin: animal.origin,
        sire_id: animal.sireId,
        dam_id: animal.damId,
        flying_weight_g: animal.flyingWeightG,
        winter_weight_g: animal.winterWeightG,
        display_order: animal.displayOrder,
        archived: animal.archived,
        archive_reason: animal.archiveReason,
        archived_at: animal.archivedAt,
        archive_type: animal.archiveType,
        date_of_death: animal.dateOfDeath,
        disposition_date: animal.dispositionDate,
        is_quarantine: animal.isQuarantine,
        distribution_map_url: animal.distributionMapUrl,
        water_tipping_temp: animal.waterTippingTemp,
        ambient_temp_only: animal.ambientTempOnly,
        acquisition_type: animal.acquisitionType,
        is_boarding: animal.isBoarding,
        created_at: animal.createdAt,
        updated_at: new Date().toISOString(),
        is_deleted: animal.isDeleted
      };
      
      const { error } = await supabase.from('animals').update(supabasePayload).eq('id', animal.id);
      if (error) throw error;
      
      await animalsCollection.update(animal.id, () => animal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] })
  });

  const filteredAnimals = animals.filter(animal => !animal.is_deleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal: addAnimalMutation.mutateAsync,
    updateAnimal: updateAnimalMutation.mutateAsync
  };
};
