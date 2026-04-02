import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
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
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', 'profile')
        .maybeSingle();

      if (error) throw error;
      
      return (data as OrgProfileSettings) || DEFAULT_SETTINGS;
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: OrgProfileSettings) => {
      const { data, error } = await supabase
        .from('organisations')
        .upsert({ ...newSettings, id: 'profile' })
        .select()
        .single();

      if (error) throw error;
      return data;
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
