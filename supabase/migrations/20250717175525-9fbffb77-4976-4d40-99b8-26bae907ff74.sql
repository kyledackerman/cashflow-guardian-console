-- Fix audit logging system by recreating triggers properly

-- Drop existing triggers first
DROP TRIGGER IF EXISTS audit_garnishment_profiles_changes ON public.garnishment_profiles;
DROP TRIGGER IF EXISTS audit_garnishment_installments_changes ON public.garnishment_installments;
DROP TRIGGER IF EXISTS audit_garnishment_documents_changes ON public.garnishment_documents;
DROP TRIGGER IF EXISTS audit_bulk_payment_batches_changes ON public.bulk_payment_batches;
DROP TRIGGER IF EXISTS audit_employees_changes ON public.employees;
DROP TRIGGER IF EXISTS audit_employee_loan_withdrawals_changes ON public.employee_loan_withdrawals;
DROP TRIGGER IF EXISTS audit_employee_loan_repayments_changes ON public.employee_loan_repayments;
DROP TRIGGER IF EXISTS audit_petty_cash_transactions_changes ON public.petty_cash_transactions;

-- Recreate the audit function with proper search_path
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
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) 
         WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
         ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
         WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
         ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate all audit triggers for all critical tables
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

CREATE TRIGGER audit_employees_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_employee_loan_withdrawals_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_loan_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_employee_loan_repayments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_loan_repayments
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

CREATE TRIGGER audit_petty_cash_transactions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.petty_cash_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Fix other security definer functions with proper search_path
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

  UPDATE public.garnishment_profiles 
  SET status = 'completed'
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id) 
    AND balance_remaining <= 0 
    AND status != 'completed';

  RETURN COALESCE(NEW, OLD);
END;
$$;