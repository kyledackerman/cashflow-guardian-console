import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EmployeeLoanRequest = Tables<'employee_loan_requests'>;
type EmployeeLoanRequestInsert = TablesInsert<'employee_loan_requests'>;
type EmployeeLoanRequestUpdate = TablesUpdate<'employee_loan_requests'>;

export const useEmployeeLoanRequests = () => {
  const [requests, setRequests] = useState<EmployeeLoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch loan requests: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (request: EmployeeLoanRequestInsert) => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_requests')
        .insert([request])
        .select()
        .single();

      if (error) throw error;
      
      setRequests(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Loan request submitted successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit loan request: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateRequest = async (id: string, updates: EmployeeLoanRequestUpdate) => {
    try {
      const { data, error } = await supabase
        .from('employee_loan_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRequests(prev => prev.map(r => r.id === id ? data : r));
      toast({
        title: "Success",
        description: "Loan request updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update loan request: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('loan-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_loan_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    requests,
    loading,
    addRequest,
    updateRequest,
    refetch: fetchRequests
  };
};