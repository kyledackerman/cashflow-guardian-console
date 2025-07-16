import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EmployeeLoanRepayment = Tables<'employee_loan_repayments'>;
type EmployeeLoanRepaymentInsert = TablesInsert<'employee_loan_repayments'>;
type EmployeeLoanRepaymentUpdate = TablesUpdate<'employee_loan_repayments'>;

export const useEmployeeLoanRepayments = () => {
  const [repayments, setRepayments] = useState<EmployeeLoanRepayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRepayments = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_repayments')
        .select('*')
        .order('payroll_date', { ascending: false });

      if (error) throw error;
      setRepayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch loan repayments: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRepayment = async (repayment: EmployeeLoanRepaymentInsert) => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_repayments')
        .insert([repayment])
        .select()
        .single();

      if (error) throw error;
      
      setRepayments(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Loan repayment recorded successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record loan repayment: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateRepayment = async (id: string, updates: EmployeeLoanRepaymentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_repayments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRepayments(prev => prev.map(r => r.id === id ? data : r));
      toast({
        title: "Success",
        description: "Loan repayment updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update loan repayment: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const getEmployeeTotalRepayments = (employeeName: string) => {
    return repayments
      .filter(r => r.employee_name === employeeName)
      .reduce((total, repayment) => total + Number(repayment.amount), 0);
  };

  useEffect(() => {
    fetchRepayments();

    // Set up real-time subscription
    const channel = supabase
      .channel('loan-repayments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_loan_repayments'
        },
        () => {
          fetchRepayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    repayments,
    loading,
    addRepayment,
    updateRepayment,
    getEmployeeTotalRepayments,
    refetch: fetchRepayments
  };
};