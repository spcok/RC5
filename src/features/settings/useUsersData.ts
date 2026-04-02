import { useQuery, useMutation } from '@tanstack/react-query';
import { User, RolePermissionConfig } from '../../types';
import { supabase } from '../../lib/supabase';
import { queryClient } from '../../lib/queryClient';

export function useUsersData() {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data as User[];
    },
  });

  const { data: rolePermissions = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['role_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('*');
      if (error) throw error;
      return data as RolePermissionConfig[];
    },
  });

  const isLoading = isLoadingUsers || isLoadingRoles;

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ role, updates }: { role: string, updates: Partial<RolePermissionConfig> }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update(updates)
        .eq('id', role.toLowerCase());
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role_permissions'] }),
  });

  return { 
    users, 
    rolePermissions, 
    isLoading, 
    deleteUser: deleteUserMutation.mutateAsync, 
    updateUser: (id: string, updates: Partial<User>) => updateUserMutation.mutateAsync({ id, updates }), 
    updateRolePermissions: (role: string, updates: Partial<RolePermissionConfig>) => updateRolePermissionsMutation.mutateAsync({ role, updates }),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
    }
  };
}
