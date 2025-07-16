-- Phase 1: Critical Security Fixes

-- Fix existing functions with proper security
CREATE OR REPLACE FUNCTION public.can_user_login(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT role != 'employee' FROM public.employees WHERE id = user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS employee_role
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT role FROM public.employees WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name employee_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT permission_name = ANY(permissions) FROM public.employees WHERE id = auth.uid();
$$;

-- Create missing user registration system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.employees (id, name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::employee_role, 'employee'::employee_role),
    true
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create employee records
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing auth users to employees table (if any exist without employee records)
INSERT INTO public.employees (id, name, role, active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'name', au.email, 'Unknown User') as name,
  'employee'::employee_role as role,
  true as active
FROM auth.users au
LEFT JOIN public.employees e ON e.id = au.id
WHERE e.id IS NULL;