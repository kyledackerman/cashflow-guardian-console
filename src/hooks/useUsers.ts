import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type User = Tables<'users'>;
type UserInsert = TablesInsert<'users'>;
type UserUpdate = TablesUpdate<'users'>;

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (user: UserInsert) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "User added successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add user: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateUser = async (id: string, updates: UserUpdate) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.id !== id));
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete user: " + error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers
  };
};