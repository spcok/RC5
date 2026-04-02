import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Contact } from '../../types';

export const useDirectoryData = () => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['directory_contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('directory_contacts').select('*');
      if (error) throw error;
      return (data || []) as Contact[];
    }
  });

  const addContactMutation = useMutation({
    mutationFn: async (contact: Omit<Contact, 'id'>) => {
      const { data, error } = await supabase.from('directory_contacts').insert([contact]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory_contacts'] })
  });

  const updateContactMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      const { data, error } = await supabase.from('directory_contacts').update(contact).eq('id', contact.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory_contacts'] })
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('directory_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory_contacts'] })
  });

  return {
    contacts,
    isLoading,
    addContact: addContactMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync
  };
};
