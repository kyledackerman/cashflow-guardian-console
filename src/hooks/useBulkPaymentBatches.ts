import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type BulkPaymentBatch = Tables<'bulk_payment_batches'>;
type BulkPaymentBatchInsert = TablesInsert<'bulk_payment_batches'>;

export const useBulkPaymentBatches = () => {
  const [batches, setBatches] = useState<BulkPaymentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_payment_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch bulk payment batches: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (batch: BulkPaymentBatchInsert) => {
    try {
      const { data, error } = await supabase
        .from('bulk_payment_batches')
        .insert([batch])
        .select()
        .single();

      if (error) throw error;

      // Log bulk payment batch creation for audit trail
      await supabase.rpc('log_admin_action', {
        action_type: 'BULK_PAYMENT_BATCH_CREATE',
        table_name: 'bulk_payment_batches',
        record_id: data.id,
        new_data: {
          batch_date: batch.batch_date,
          total_amount: batch.total_amount,
          total_payments: batch.total_payments,
          notes: batch.notes
        }
      });
      
      setBatches(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Bulk payment batch created successfully"
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk payment batch",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return {
    batches,
    loading,
    createBatch,
    refetch: fetchBatches
  };
};