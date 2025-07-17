-- Fix audit logging system and security issues

-- First, fix the audit function to have proper search_path
CREATE OR REPLACE FUNCTION public.audit_garnishment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate all audit triggers for garnishment-related tables
CREATE TRIGGER audit_garnishment_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_garnishment_installments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_installments
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_garnishment_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_bulk_payment_batches_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bulk_payment_batches
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Fix other functions with missing search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_garnishment_profile_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the garnishment profile with current totals
  UPDATE public.garnishment_profiles 
  SET 
    amount_paid_so_far = COALESCE((
      SELECT SUM(amount) 
      FROM public.garnishment_installments 
      WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
    ), 0),
    balance_remaining = total_amount_owed - COALESCE((
      SELECT SUM(amount) 
      FROM public.garnishment_installments 
      WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);

  -- Auto-update status to completed if balance is zero or negative
  UPDATE public.garnishment_profiles 
  SET status = 'completed'
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id) 
    AND balance_remaining <= 0 
    AND status != 'completed';

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_garnishment_installment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_balance NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Get current profile balance
  SELECT balance_remaining INTO profile_balance
  FROM public.garnishment_profiles 
  WHERE id = NEW.profile_id;
  
  -- Validate amount doesn't exceed remaining balance
  IF NEW.amount > profile_balance THEN
    RAISE EXCEPTION 'Payment amount %.2f exceeds remaining balance %.2f', 
      NEW.amount, profile_balance;
  END IF;
  
  -- Validate amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_garnishment_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate total amount owed is positive
  IF NEW.total_amount_owed <= 0 THEN
    RAISE EXCEPTION 'Total amount owed must be greater than zero';
  END IF;
  
  -- Ensure case number is not empty
  IF NEW.case_number IS NULL OR trim(NEW.case_number) = '' THEN
    RAISE EXCEPTION 'Case number is required';
  END IF;
  
  -- Ensure creditor is not empty
  IF NEW.creditor IS NULL OR trim(NEW.creditor) = '' THEN
    RAISE EXCEPTION 'Creditor name is required';
  END IF;
  
  RETURN NEW;
END;
$$;