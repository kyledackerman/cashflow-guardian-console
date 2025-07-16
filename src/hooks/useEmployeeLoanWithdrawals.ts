import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EmployeeLoanWithdrawal = Tables<'employee_loan_withdrawals'>;
type EmployeeLoanWithdrawalInsert = TablesInsert<'employee_loan_withdrawals'>;
type EmployeeLoanWithdrawalUpdate = TablesUpdate<'employee_loan_withdrawals'>;

export const useEmployeeLoanWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<EmployeeLoanWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_withdrawals')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch loan withdrawals: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addWithdrawal = async (withdrawal: EmployeeLoanWithdrawalInsert) => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_withdrawals')
        .insert([withdrawal])
        .select()
        .single();

      if (error) throw error;
      
      setWithdrawals(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Loan withdrawal recorded successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record loan withdrawal: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateWithdrawal = async (id: string, updates: EmployeeLoanWithdrawalUpdate) => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_withdrawals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setWithdrawals(prev => prev.map(w => w.id === id ? data : w));
      toast({
        title: "Success",
        description: "Loan withdrawal updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update loan withdrawal: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const getEmployeeOutstandingLoans = (employeeName: string) => {
    return withdrawals
      .filter(w => w.employee_name === employeeName && w.status !== 'rejected')
      .reduce((total, withdrawal) => total + Number(withdrawal.amount), 0);
  };

  useEffect(() => {
    fetchWithdrawals();

    // Set up real-time subscription
    const channel = supabase
      .channel('loan-withdrawals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_loan_withdrawals'
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    withdrawals,
    loading,
    addWithdrawal,
    updateWithdrawal,
    getEmployeeOutstandingLoans,
    refetch: fetchWithdrawals
  };
};