import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type GarnishmentProfile = Tables<'garnishment_profiles'>;
type GarnishmentProfileInsert = TablesInsert<'garnishment_profiles'>;
type GarnishmentProfileUpdate = TablesUpdate<'garnishment_profiles'>;

export const useGarnishmentProfiles = () => {
  const [profiles, setProfiles] = useState<GarnishmentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('garnishment_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch garnishment profiles: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addProfile = async (profile: GarnishmentProfileInsert) => {
    try {
      const { data, error } = await supabase
        .from('garnishment_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        // Handle specific constraint violations with user-friendly messages
        if (error.message.includes('unique_case_number')) {
          throw new Error(`Case number "${profile.case_number}" already exists. Please use a unique case number.`);
        }
        if (error.message.includes('Case number is required')) {
          throw new Error('Case number is required and cannot be empty.');
        }
        if (error.message.includes('Creditor name is required')) {
          throw new Error('Creditor name is required and cannot be empty.');
        }
        throw error;
      }
      
      setProfiles(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Garnishment profile created successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create garnishment profile",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateProfile = async (id: string, updates: GarnishmentProfileUpdate) => {
    try {
      const { data, error } = await supabase
        .from('garnishment_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setProfiles(prev => prev.map(p => p.id === id ? data : p));
      toast({
        title: "Success",
        description: "Garnishment profile updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update garnishment profile: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('garnishment_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProfiles(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Garnishment profile deleted successfully"
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete garnishment profile: " + error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchProfiles();

    // Set up real-time subscription
    const channel = supabase
      .channel('garnishment-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'garnishment_profiles'
        },
        () => {
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    profiles,
    loading,
    addProfile,
    updateProfile,
    deleteProfile,
    refetch: fetchProfiles
  };
};