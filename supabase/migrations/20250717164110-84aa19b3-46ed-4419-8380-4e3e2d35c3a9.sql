-- Create audit function for garnishment changes
CREATE OR REPLACE FUNCTION public.audit_garnishment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the change to audit_logs table
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for audit logging
CREATE TRIGGER audit_garnishment_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_garnishment_installments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_installments
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Create bulk payment batches table
CREATE TABLE public.bulk_payment_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES public.employees(id),
  created_by_name TEXT NOT NULL,
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_payments INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bulk payment batches
ALTER TABLE public.bulk_payment_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for bulk payment batches
CREATE POLICY "Users can view bulk payment batches"
ON public.bulk_payment_batches
FOR SELECT
USING (user_has_permission('VIEW_FINANCES'::employee_permission));

CREATE POLICY "Users with EDIT_TRANSACTIONS can manage bulk payment batches"
ON public.bulk_payment_batches
FOR ALL
USING (user_has_permission('EDIT_TRANSACTIONS'::employee_permission));

-- Add batch_id to garnishment_installments
ALTER TABLE public.garnishment_installments
ADD COLUMN batch_id UUID REFERENCES public.bulk_payment_batches(id);

-- Add trigger for bulk payment batches updated_at
CREATE TRIGGER update_bulk_payment_batches_updated_at
  BEFORE UPDATE ON public.bulk_payment_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();