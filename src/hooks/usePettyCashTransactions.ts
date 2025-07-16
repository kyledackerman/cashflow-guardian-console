import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PettyCashTransaction = Tables<'petty_cash_transactions'>;
type PettyCashTransactionInsert = TablesInsert<'petty_cash_transactions'>;
type PettyCashTransactionUpdate = TablesUpdate<'petty_cash_transactions'>;

export const usePettyCashTransactions = () => {
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch petty cash transactions: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: PettyCashTransactionInsert) => {
    try {
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Transaction added successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add transaction: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateTransaction = async (id: string, updates: PettyCashTransactionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update transaction: " + error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('petty_cash_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete transaction: " + error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const calculateBalance = () => {
    return transactions
      .filter(t => t.approved)
      .reduce((balance, transaction) => {
        return transaction.type === 'credit' 
          ? balance + Number(transaction.amount)
          : balance - Number(transaction.amount);
      }, 0);
  };

  const getPendingCount = () => {
    return transactions.filter(t => !t.approved).length;
  };

  useEffect(() => {
    fetchTransactions();

    // Set up real-time subscription
    const channel = supabase
      .channel('petty-cash-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'petty_cash_transactions'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    calculateBalance,
    getPendingCount,
    refetch: fetchTransactions
  };
};