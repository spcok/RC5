import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/dexieDb';
import { Contact } from '../../types';

export const useDirectoryData = () => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['directory_contacts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('directory_contacts').select('*');
        if (error) throw error;
        if (data) await db.directory_contacts.bulkPut(data);
        return (data || []) as Contact[];
      } catch (err) {
        console.log('📡 Network offline. Reading Contacts from Dexie...', err);
        return await db.directory_contacts.toArray();
      }
    }
  });

  const addContactMutation = useMutation({
    mutationFn: async (contact: Omit<Contact, 'id'>) => {
      const payload = { ...contact, id: crypto.randomUUID() };
      try {
        const { data, error } = await supabase.from('directory_contacts').insert([payload]).select().single();
        if (error) throw error;
        await db.directory_contacts.put(data);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Saving Contact locally...', err);
        await db.directory_contacts.put(payload as Contact);
        return payload as Contact;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory_contacts'] })
  });

  const updateContactMutation = useMutation({
    mutationFn: async (contact: Contact) => {
      try {
        const { data, error } = await supabase.from('directory_contacts').update(contact).eq('id', contact.id).select().single();
        if (error) throw error;
        await db.directory_contacts.put(contact);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Updating Contact locally...', err);
        await db.directory_contacts.put(contact);
        return contact;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['directory_contacts'] })
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('directory_contacts').delete().eq('id', id);
        if (error) throw error;
        await db.directory_contacts.delete(id);
      } catch (err) {
        console.log('📡 Network offline. Deleting Contact locally...', err);
        await db.directory_contacts.delete(id);
      }
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
