-- Add audit triggers for missing critical tables

-- Create audit triggers for garnishment_documents
CREATE TRIGGER audit_garnishment_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Create audit triggers for bulk_payment_batches  
CREATE TRIGGER audit_bulk_payment_batches_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bulk_payment_batches
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Create audit triggers for employees
CREATE TRIGGER audit_employees_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Create audit triggers for employee_loan_withdrawals
CREATE TRIGGER audit_employee_loan_withdrawals_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_loan_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Create audit triggers for employee_loan_repayments
CREATE TRIGGER audit_employee_loan_repayments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_loan_repayments
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();

-- Create audit triggers for petty_cash_transactions
CREATE TRIGGER audit_petty_cash_transactions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.petty_cash_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_garnishment_changes();