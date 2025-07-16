import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PettyCashTransaction = Tables<'petty_cash_transactions'>;
type PettyCashInsert = TablesInsert<'petty_cash_transactions'>;
type PettyCashUpdate = TablesUpdate<'petty_cash_transactions'>;

export const usePettyCash = () => {
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
        description: "Failed to fetch transactions: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: PettyCashInsert) => {
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

  const updateTransaction = async (id: string, updates: PettyCashUpdate) => {
    try {
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(txn => txn.id === id ? data : txn));
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
      
      setTransactions(prev => prev.filter(txn => txn.id !== id));
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
    return transactions.reduce((balance, txn) => {
      return txn.type === 'credit' ? balance + Number(txn.amount) : balance - Number(txn.amount);
    }, 0);
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
    balance: calculateBalance(),
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  };
};