import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type CollectionAgency = Tables<'collection_agencies'>;
type CollectionAgencyInsert = TablesInsert<'collection_agencies'>;
type CollectionAgencyUpdate = TablesUpdate<'collection_agencies'>;

export function useCollectionAgencies() {
  const [agencies, setAgencies] = useState<CollectionAgency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('collection_agencies')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAgencies(data || []);
    } catch (error: any) {
      console.error('Error fetching collection agencies:', error);
      toast({
        title: "Error",
        description: "Failed to load collection agencies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAgency = async (agency: CollectionAgencyInsert) => {
    try {
      const { data, error } = await supabase
        .from('collection_agencies')
        .insert(agency)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection agency added successfully",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding collection agency:', error);
      
      let errorMessage = "Failed to add collection agency";
      if (error.code === '23505') {
        errorMessage = "A collection agency with this name already exists";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { data: null, error };
    }
  };

  const updateAgency = async (id: string, updates: CollectionAgencyUpdate) => {
    try {
      const { data, error } = await supabase
        .from('collection_agencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection agency updated successfully",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating collection agency:', error);
      toast({
        title: "Error",
        description: "Failed to update collection agency",
        variant: "destructive",
      });

      return { data: null, error };
    }
  };

  const deleteAgency = async (id: string) => {
    try {
      // Soft delete by setting active to false
      const { error } = await supabase
        .from('collection_agencies')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection agency deleted successfully",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting collection agency:', error);
      toast({
        title: "Error",
        description: "Failed to delete collection agency",
        variant: "destructive",
      });

      return { error };
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchAgencies();
  };

  useEffect(() => {
    fetchAgencies();

    // Set up real-time subscription
    const channel = supabase
      .channel('collection_agencies_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'collection_agencies' }, 
        () => {
          fetchAgencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    agencies,
    loading,
    addAgency,
    updateAgency,
    deleteAgency,
    refetch,
  };
}