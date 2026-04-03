import { useLiveQuery } from '@tanstack/react-db';
import { directoryCollection } from '../../lib/database';
import { Contact } from '../../types';

export const useDirectoryData = () => {
  const { data: contacts = [], isLoading } = useLiveQuery(directoryCollection);

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    const payload = { ...contact, id: crypto.randomUUID() };
    await directoryCollection.insert(payload as Contact);
    return payload;
  };

  const updateContact = async (contact: Contact) => {
    await directoryCollection.update(contact);
    return contact;
  };

  const deleteContact = async (id: string) => {
    await directoryCollection.update({ id, is_deleted: true });
  };

  return {
    contacts: contacts.filter(c => !c.is_deleted),
    isLoading,
    addContact,
    updateContact,
    deleteContact
  };
};
