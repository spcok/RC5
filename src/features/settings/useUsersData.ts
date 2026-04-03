import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, RolePermissionConfig } from '../../types';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';

export function useUsersData() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('is_deleted', false);
        if (error) throw error;
        if (data) await db.users.bulkPut(data);
        return data as User[];
      } catch (err) {
        console.log('📡 Network offline. Reading Users from Dexie...', err);
        return await db.users.where('is_deleted').equals(false).toArray();
      }
    },
  });

  const { data: rolePermissions = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['role_permissions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('role_permissions').select('*');
        if (error) throw error;
        return data as RolePermissionConfig[];
      } catch (err) {
        console.log('📡 Network offline. Reading Roles from Dexie...', err);
        return [];
      }
    },
  });

  const isLoading = isLoadingUsers || isLoadingRoles;

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('users').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        await db.users.update(id, { is_deleted: true });
      } catch (err) {
        console.log('📡 Network offline. Deleting User locally...', err);
        await db.users.update(id, { is_deleted: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
      try {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
        await db.users.update(id, updates);
      } catch (err) {
        console.log('📡 Network offline. Updating User locally...', err);
        await db.users.update(id, updates);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password?: string; profileData: Partial<User> }) => {
      try {
        const { data, error } = await supabase.functions.invoke('create-staff-account', {
          body: userData
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const newUser = data.user as User;
        await db.users.put(newUser);
        return data;
      } catch (err) {
        console.log('📡 Network offline. Cannot create staff account offline.', err);
        throw err;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ role, updates }: { role: string, updates: Partial<RolePermissionConfig> }) => {
      try {
        const { error } = await supabase
          .from('role_permissions')
          .update(updates)
          .eq('id', role.toLowerCase());
        if (error) throw error;
      } catch (err) {
        console.log('📡 Network offline. Cannot update roles offline.', err);
        throw err;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role_permissions'] }),
  });

  return { 
    users, 
    rolePermissions, 
    isLoading, 
    deleteUser: deleteUserMutation.mutateAsync, 
    addUser: addUserMutation.mutateAsync,
    updateUser: (id: string, updates: Partial<User>) => updateUserMutation.mutateAsync({ id, updates }), 
    updateRolePermissions: (role: string, updates: Partial<RolePermissionConfig>) => updateRolePermissionsMutation.mutateAsync({ role, updates }),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
    }
  };
}
