import { useLiveQuery } from '@tanstack/react-db';
import { orgSettingsCollection } from '../../lib/database';
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
  const { data: settings = [], isLoading } = useLiveQuery(orgSettingsCollection);

  const saveSettings = async (newSettings: OrgProfileSettings) => {
    await orgSettingsCollection.update(newSettings);
  };

  return { 
    settings: settings[0] || DEFAULT_SETTINGS, 
    isLoading, 
    saveSettings 
  };
}
