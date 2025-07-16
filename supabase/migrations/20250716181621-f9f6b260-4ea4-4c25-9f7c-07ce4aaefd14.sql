-- Security Enhancement Migration
-- Adds WITH CHECK clauses and improves RLS policies

-- 1. Enhance RLS policies for employee_loan_requests
DROP POLICY IF EXISTS "Managers can update loan requests" ON public.employee_loan_requests;
CREATE POLICY "Managers can update loan requests" 
ON public.employee_loan_requests 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['manager'::employee_role, 'admin'::employee_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['manager'::employee_role, 'admin'::employee_role]));

-- 2. Enhance RLS policies for employee_loan_withdrawals
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can update withdrawals" ON public.employee_loan_withdrawals;
CREATE POLICY "Users with EDIT_TRANSACTIONS can update withdrawals" 
ON public.employee_loan_withdrawals 
FOR UPDATE 
USING (user_has_permission('EDIT_TRANSACTIONS'::employee_permission))
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'::employee_permission));

-- 3. Enhance RLS policies for petty_cash_transactions
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can update petty cash" ON public.petty_cash_transactions;
CREATE POLICY "Users with EDIT_TRANSACTIONS can update petty cash" 
ON public.petty_cash_transactions 
FOR UPDATE 
USING (user_has_permission('EDIT_TRANSACTIONS'::employee_permission))
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'::employee_permission));

-- 4. Add WITH CHECK to INSERT policies for consistency
DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can create petty cash" ON public.petty_cash_transactions;
CREATE POLICY "Users with EDIT_TRANSACTIONS can create petty cash" 
ON public.petty_cash_transactions 
FOR INSERT 
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'::employee_permission));

DROP POLICY IF EXISTS "Users with EDIT_TRANSACTIONS can create withdrawals" ON public.employee_loan_withdrawals;
CREATE POLICY "Users with EDIT_TRANSACTIONS can create withdrawals" 
ON public.employee_loan_withdrawals 
FOR INSERT 
WITH CHECK (user_has_permission('EDIT_TRANSACTIONS'::employee_permission));

-- 5. Update handle_new_user function to restrict initial role to 'employee'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.employees (id, name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    -- Force all new signups to be 'employee' role for security
    'employee'::employee_role,
    true
  );
  RETURN NEW;
END;
$function$;

-- 6. Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.employees(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin'::employee_role);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type text,
  table_name text,
  record_id uuid DEFAULT NULL,
  old_data jsonb DEFAULT NULL,
  new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Only log if user has admin permissions
  IF get_current_user_role() IN ('admin'::employee_role, 'manager'::employee_role) THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), action_type, table_name, record_id, old_data, new_data);
  END IF;
END;
$function$;