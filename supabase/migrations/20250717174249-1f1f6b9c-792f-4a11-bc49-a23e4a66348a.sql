-- Phase 1: Create missing permission mapping function
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    -- Admin has all permissions
    WHEN role = 'admin' THEN true
    -- Manager permissions
    WHEN role = 'manager' AND permission_name IN (
      'VIEW_FINANCES', 'EDIT_TRANSACTIONS', 'APPROVE_TRANSACTIONS', 'DELETE_RECORDS'
    ) THEN true
    -- User permissions  
    WHEN role = 'user' AND permission_name = 'VIEW_FINANCES' THEN true
    ELSE false
  END
  FROM public.users WHERE id = auth.uid();
$$;

-- Phase 2: Update all RLS policies to use new functions
-- Drop all existing policies that reference old system
DROP POLICY IF EXISTS "Users with VIEW_FINANCES can view petty cash" ON public.petty_cash_transactions;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can create petty cash" ON public.petty_cash_transactions;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can update petty cash" ON public.petty_cash_transactions;
DROP POLICY IF EXISTS "Users with DELETE_RECORDS can delete petty cash" ON public.petty_cash_transactions;

DROP POLICY IF EXISTS "Users can view garnishment profiles" ON public.garnishment_profiles;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can manage profiles" ON public.garnishment_profiles;

DROP POLICY IF EXISTS "Users can view garnishment installments" ON public.garnishment_installments;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can manage installments" ON public.garnishment_installments;

DROP POLICY IF EXISTS "Users can view garnishment documents" ON public.garnishment_documents;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can manage documents" ON public.garnishment_documents;

DROP POLICY IF EXISTS "Users can view bulk payment batches" ON public.bulk_payment_batches;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can manage bulk payment batches" ON public.bulk_payment_batches;

DROP POLICY IF EXISTS "Users can view loan withdrawals" ON public.employee_loan_withdrawals;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can create withdrawals" ON public.employee_loan_withdrawals;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can update withdrawals" ON public.employee_loan_withdrawals;

DROP POLICY IF EXISTS "Users can view loan repayments" ON public.employee_loan_repayments;
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can manage repayments" ON public.employee_loan_repayments;

DROP POLICY IF EXISTS "Users can view loan requests" ON public.employee_loan_requests;
DROP POLICY IF EXISTS "Users can create loan requests" ON public.employee_loan_requests;
DROP POLICY IF EXISTS "Managers can update loan requests" ON public.employee_loan_requests;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

-- Create new RLS policies using the new user system
-- Petty Cash Transactions
CREATE POLICY "Users can view petty cash transactions" 
ON public.petty_cash_transactions 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can create petty cash transactions" 
ON public.petty_cash_transactions 
FOR INSERT 
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Managers can update petty cash transactions" 
ON public.petty_cash_transactions 
FOR UPDATE 
USING (user_has_permission('EDIT_TRANSACTIONS'))
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Managers can delete petty cash transactions" 
ON public.petty_cash_transactions 
FOR DELETE 
USING (user_has_permission('DELETE_RECORDS'));

-- Garnishment Profiles
CREATE POLICY "Users can view garnishment profiles" 
ON public.garnishment_profiles 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can manage garnishment profiles" 
ON public.garnishment_profiles 
FOR ALL 
USING (user_has_permission('EDIT_TRANSACTIONS'));

-- Garnishment Installments  
CREATE POLICY "Users can view garnishment installments" 
ON public.garnishment_installments 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can manage garnishment installments" 
ON public.garnishment_installments 
FOR ALL 
USING (user_has_permission('EDIT_TRANSACTIONS'));

-- Garnishment Documents
CREATE POLICY "Users can view garnishment documents" 
ON public.garnishment_documents 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can manage garnishment documents" 
ON public.garnishment_documents 
FOR ALL 
USING (user_has_permission('EDIT_TRANSACTIONS'));

-- Bulk Payment Batches
CREATE POLICY "Users can view bulk payment batches" 
ON public.bulk_payment_batches 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can manage bulk payment batches" 
ON public.bulk_payment_batches 
FOR ALL 
USING (user_has_permission('EDIT_TRANSACTIONS'));

-- Employee Loan Withdrawals
CREATE POLICY "Users can view loan withdrawals" 
ON public.employee_loan_withdrawals 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can create loan withdrawals" 
ON public.employee_loan_withdrawals 
FOR INSERT 
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Managers can update loan withdrawals" 
ON public.employee_loan_withdrawals 
FOR UPDATE 
USING (user_has_permission('EDIT_TRANSACTIONS'))
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'));

-- Employee Loan Repayments
CREATE POLICY "Users can view loan repayments" 
ON public.employee_loan_repayments 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Managers can manage loan repayments" 
ON public.employee_loan_repayments 
FOR ALL 
USING (user_has_permission('EDIT_TRANSACTIONS'));

-- Employee Loan Requests
CREATE POLICY "Users can view loan requests" 
ON public.employee_loan_requests 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'));

CREATE POLICY "All users can create loan requests" 
ON public.employee_loan_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Managers can update loan requests" 
ON public.employee_loan_requests 
FOR UPDATE 
USING (user_has_permission('APPROVE_TRANSACTIONS'))
WITH CHECK (user_has_permission('APPROVE_TRANSACTIONS'));

-- Audit Logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (user_has_role('admin'));

-- Phase 3: Update log_admin_action function to use new role system
CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, table_name text, record_id uuid DEFAULT NULL, old_data jsonb DEFAULT NULL, new_data jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only log if user has manager or admin role
  IF user_has_role('manager') OR user_has_role('admin') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), action_type, table_name, record_id, old_data, new_data);
  END IF;
END;
$$;