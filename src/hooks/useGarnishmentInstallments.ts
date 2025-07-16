import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type GarnishmentInstallment = Tables<'garnishment_installments'>;
type GarnishmentInstallmentInsert = TablesInsert<'garnishment_installments'>;
type GarnishmentInstallmentUpdate = TablesUpdate<'garnishment_installments'>;

export const useGarnishmentInstallments = () => {
  const [installments, setInstallments] = useState<GarnishmentInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstallments = async () => {
    try {
      const { data, error } = await supabase
        .from('garnishment_installments')
        .select('*')
        .order('payroll_date', { ascending: false });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch garnishment installments: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addInstallment = async (installment: GarnishmentInstallmentInsert) => {
    try {
      const { data, error } = await supabase
        .from('garnishment_installments')
        .insert([installment])
        .select()
        .single();

      if (error) throw error;
      
      setInstallments(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Garnishment installment recorded successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record garnishment installment: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateInstallment = async (id: string, updates: GarnishmentInstallmentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('garnishment_installments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setInstallments(prev => prev.map(i => i.id === id ? data : i));
      toast({
        title: "Success",
        description: "Garnishment installment updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update garnishment installment: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const getInstallmentsByProfile = (profileId: string) => {
    return installments.filter(i => i.profile_id === profileId);
  };

  const getTotalPaidForProfile = (profileId: string) => {
    return installments
      .filter(i => i.profile_id === profileId)
      .reduce((total, installment) => total + Number(installment.amount), 0);
  };

  useEffect(() => {
    fetchInstallments();

    // Set up real-time subscription
    const channel = supabase
      .channel('garnishment-installments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'garnishment_installments'
        },
        () => {
          fetchInstallments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    installments,
    loading,
    addInstallment,
    updateInstallment,
    getInstallmentsByProfile,
    getTotalPaidForProfile,
    refetch: fetchInstallments
  };
};