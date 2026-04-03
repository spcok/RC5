import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { OrgProfileSettings } from '../../types';

const DEFAULT_SETTINGS: OrgProfileSettings = {
  id: 'profile',
  org_name: 'Kent Owl Academy',
  logo_url: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  zla_license_number: '',
  official_website: '',
  adoption_portal: '',
};

export function useOrgSettings() {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['org_settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', 'profile')
          .maybeSingle();

        if (error) throw error;
        if (data) await db.org_settings.put(data as OrgProfileSettings);
        return (data as OrgProfileSettings) || DEFAULT_SETTINGS;
      } catch (err) {
        console.log('📡 Network offline. Reading Org Settings from Dexie...', err);
        const local = await db.org_settings.get('profile');
        return local || DEFAULT_SETTINGS;
      }
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: OrgProfileSettings) => {
      try {
        const { data, error } = await supabase
          .from('organisations')
          .upsert({ ...newSettings, id: 'profile' })
          .select()
          .single();

        if (error) throw error;
        await db.org_settings.put(data as OrgProfileSettings);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Org Settings locally...', err);
        await db.org_settings.put(newSettings);
        return newSettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org_settings'] });
    }
  });

  return { 
    settings, 
    isLoading, 
    saveSettings: saveSettingsMutation.mutateAsync 
  };
}
