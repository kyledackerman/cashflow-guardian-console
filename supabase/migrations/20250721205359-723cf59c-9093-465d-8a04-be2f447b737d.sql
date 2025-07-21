
-- Create a function to sync users to employees table
CREATE OR REPLACE FUNCTION public.sync_users_to_employees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert users into employees table that don't already exist
  INSERT INTO public.employees (id, name, role, active, created_at, updated_at)
  SELECT 
    u.id,
    u.name,
    CASE 
      WHEN u.role = 'admin' THEN 'admin'::employee_role
      WHEN u.role = 'manager' THEN 'manager'::employee_role
      ELSE 'employee'::employee_role
    END,
    u.active,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id NOT IN (SELECT id FROM public.employees)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = now();
END;
$$;

-- Create trigger function to automatically sync when users are added/updated
CREATE OR REPLACE FUNCTION public.sync_user_to_employee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert or update employee record when user is created/updated
  INSERT INTO public.employees (id, name, role, active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.name,
    CASE 
      WHEN NEW.role = 'admin' THEN 'admin'::employee_role
      WHEN NEW.role = 'manager' THEN 'manager'::employee_role
      ELSE 'employee'::employee_role
    END,
    NEW.active,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync users to employees
DROP TRIGGER IF EXISTS sync_user_to_employee_trigger ON public.users;
CREATE TRIGGER sync_user_to_employee_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_employee();

-- Run initial sync to populate all existing users into employees table
SELECT public.sync_users_to_employees();
