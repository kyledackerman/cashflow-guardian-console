-- Phase 2: Drop all existing policies and functions that depend on the old structure
DROP POLICY "Admins can manage employees" ON public.employees;
DROP POLICY "Users can view all employees" ON public.employees;
DROP POLICY "Managers can update loan requests" ON public.employee_loan_requests;
DROP POLICY "Only admins can view audit logs" ON public.audit_logs;

-- Drop old functions
DROP FUNCTION public.get_current_user_role();
DROP FUNCTION public.user_has_permission(employee_permission);

-- Create new database functions
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
    CASE 
      WHEN NEW.email LIKE '%@custom-maids.co' THEN 'manager'::public.user_role
      ELSE 'user'::public.user_role
    END,
    true
  );
  RETURN NEW;
END;
$$;

-- Create new RLS policies for users table
CREATE POLICY "Admins can manage users" 
ON public.users 
FOR ALL 
USING (user_has_role('admin'));

CREATE POLICY "Users can view all users" 
ON public.users 
FOR SELECT 
USING (true);

-- Add updated_at trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();