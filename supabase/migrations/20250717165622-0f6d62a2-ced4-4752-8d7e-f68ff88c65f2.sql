-- Phase 1: Create new user_role enum and update table structure
CREATE TYPE public.user_role AS ENUM ('user', 'manager', 'admin');

-- Create new users table with simplified structure
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Copy data from employees to users table with role mapping
INSERT INTO public.users (id, name, role, active, created_at, updated_at)
SELECT 
  id, 
  name,
  CASE 
    WHEN role = 'employee' THEN 'user'::public.user_role
    WHEN role = 'manager' THEN 'manager'::public.user_role  
    WHEN role = 'admin' THEN 'admin'::public.user_role
    ELSE 'user'::public.user_role
  END as role,
  active,
  created_at,
  updated_at
FROM public.employees;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Admins can manage users" 
ON public.users 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view all users" 
ON public.users 
FOR SELECT 
USING (true);

-- Phase 2: Update database functions to work with new structure
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    WHEN required_role = 'user' THEN 
      role IN ('user', 'manager', 'admin')
    WHEN required_role = 'manager' THEN 
      role IN ('manager', 'admin')
    WHEN required_role = 'admin' THEN 
      role = 'admin'
    ELSE false
  END
  FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_user_login(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT active = true FROM public.users WHERE id = user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    -- Assign manager role for @custom-maids.co emails, user for all others
    CASE 
      WHEN NEW.email LIKE '%@custom-maids.co' THEN 'manager'::public.user_role
      ELSE 'user'::public.user_role
    END,
    true
  );
  RETURN NEW;
END;
$$;

-- Phase 3: Update all RLS policies to use role-based checks instead of permissions

-- Update petty_cash_transactions policies
DROP POLICY "Users with DELETE_RECORDS can delete petty cash" ON public.petty_cash_transactions;
DROP POLICY "Users with EDIT_TRANSACTIONS can create petty cash" ON public.petty_cash_transactions;
DROP POLICY "Users with EDIT_TRANSACTIONS can update petty cash" ON public.petty_cash_transactions;
DROP POLICY "Users with VIEW_FINANCES can view petty cash" ON public.petty_cash_transactions;

CREATE POLICY "Managers can delete petty cash" 
ON public.petty_cash_transactions 
FOR DELETE 
USING (user_has_role('manager'));

CREATE POLICY "Managers can create petty cash" 
ON public.petty_cash_transactions 
FOR INSERT 
WITH CHECK (user_has_role('manager'));

CREATE POLICY "Managers can update petty cash" 
ON public.petty_cash_transactions 
FOR UPDATE 
USING (user_has_role('manager'))
WITH CHECK (user_has_role('manager'));

CREATE POLICY "Users can view petty cash" 
ON public.petty_cash_transactions 
FOR SELECT 
USING (user_has_role('user'));

-- Update garnishment_profiles policies
DROP POLICY "Users can view garnishment profiles" ON public.garnishment_profiles;
DROP POLICY "Users with EDIT_TRANSACTIONS can manage profiles" ON public.garnishment_profiles;

CREATE POLICY "Users can view garnishment profiles" 
ON public.garnishment_profiles 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can manage garnishment profiles" 
ON public.garnishment_profiles 
FOR ALL 
USING (user_has_role('manager'));

-- Update garnishment_installments policies
DROP POLICY "Users can view garnishment installments" ON public.garnishment_installments;
DROP POLICY "Users with EDIT_TRANSACTIONS can manage installments" ON public.garnishment_installments;

CREATE POLICY "Users can view garnishment installments" 
ON public.garnishment_installments 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can manage garnishment installments" 
ON public.garnishment_installments 
FOR ALL 
USING (user_has_role('manager'));

-- Update garnishment_documents policies
DROP POLICY "Users can view garnishment documents" ON public.garnishment_documents;
DROP POLICY "Users with EDIT_TRANSACTIONS can manage documents" ON public.garnishment_documents;

CREATE POLICY "Users can view garnishment documents" 
ON public.garnishment_documents 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can manage garnishment documents" 
ON public.garnishment_documents 
FOR ALL 
USING (user_has_role('manager'));

-- Update bulk_payment_batches policies
DROP POLICY "Users can view bulk payment batches" ON public.bulk_payment_batches;
DROP POLICY "Users with EDIT_TRANSACTIONS can manage bulk payment batches" ON public.bulk_payment_batches;

CREATE POLICY "Users can view bulk payment batches" 
ON public.bulk_payment_batches 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can manage bulk payment batches" 
ON public.bulk_payment_batches 
FOR ALL 
USING (user_has_role('manager'));

-- Update employee_loan_withdrawals policies
DROP POLICY "Users can view loan withdrawals" ON public.employee_loan_withdrawals;
DROP POLICY "Users with EDIT_TRANSACTIONS can create withdrawals" ON public.employee_loan_withdrawals;
DROP POLICY "Users with EDIT_TRANSACTIONS can update withdrawals" ON public.employee_loan_withdrawals;

CREATE POLICY "Users can view loan withdrawals" 
ON public.employee_loan_withdrawals 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can create loan withdrawals" 
ON public.employee_loan_withdrawals 
FOR INSERT 
WITH CHECK (user_has_role('manager'));

CREATE POLICY "Managers can update loan withdrawals" 
ON public.employee_loan_withdrawals 
FOR UPDATE 
USING (user_has_role('manager'))
WITH CHECK (user_has_role('manager'));

-- Update employee_loan_repayments policies
DROP POLICY "Users can view loan repayments" ON public.employee_loan_repayments;
DROP POLICY "Users with EDIT_TRANSACTIONS can manage repayments" ON public.employee_loan_repayments;

CREATE POLICY "Users can view loan repayments" 
ON public.employee_loan_repayments 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can manage loan repayments" 
ON public.employee_loan_repayments 
FOR ALL 
USING (user_has_role('manager'));

-- Update employee_loan_requests policies
DROP POLICY "Users can view loan requests" ON public.employee_loan_requests;
DROP POLICY "Managers can update loan requests" ON public.employee_loan_requests;
DROP POLICY "Users can create loan requests" ON public.employee_loan_requests;

CREATE POLICY "Users can view loan requests" 
ON public.employee_loan_requests 
FOR SELECT 
USING (user_has_role('user'));

CREATE POLICY "Managers can update loan requests" 
ON public.employee_loan_requests 
FOR UPDATE 
USING (user_has_role('manager'))
WITH CHECK (user_has_role('manager'));

CREATE POLICY "Users can create loan requests" 
ON public.employee_loan_requests 
FOR INSERT 
WITH CHECK (true);

-- Update audit_logs policy to use role check
DROP POLICY "Only admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (user_has_role('admin'));

-- Add updated_at trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the old employee_permission enum and employees table after everything is migrated
DROP TABLE public.employees CASCADE;
DROP TYPE public.employee_permission;
DROP TYPE public.employee_role;