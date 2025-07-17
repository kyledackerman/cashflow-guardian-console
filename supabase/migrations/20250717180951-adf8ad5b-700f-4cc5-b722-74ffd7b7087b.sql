-- Fix the role system: restore Employee → Manager → Admin hierarchy (with CASCADE)

-- Step 1: Drop and recreate functions that depend on the old enum
DROP FUNCTION IF EXISTS public.user_has_role(user_role) CASCADE;

-- Step 2: Update the user_role enum to use 'employee' instead of 'user'
ALTER TYPE public.user_role RENAME TO user_role_old;
CREATE TYPE public.user_role AS ENUM ('employee', 'manager', 'admin');

-- Step 3: Update the users table to use the correct enum
ALTER TABLE public.users 
ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.users 
ALTER COLUMN role TYPE public.user_role USING 
  CASE 
    WHEN role::text = 'user' THEN 'employee'::public.user_role
    WHEN role::text = 'manager' THEN 'manager'::public.user_role
    WHEN role::text = 'admin' THEN 'admin'::public.user_role
    ELSE 'employee'::public.user_role
  END;

ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'employee'::public.user_role;

-- Step 4: Drop the old enum with CASCADE
DROP TYPE public.user_role_old CASCADE;

-- Step 5: Recreate database functions with correct role hierarchy
CREATE OR REPLACE FUNCTION public.user_has_role(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    WHEN required_role = 'employee' THEN 
      role IN ('employee', 'manager', 'admin')
    WHEN required_role = 'manager' THEN 
      role IN ('manager', 'admin')
    WHEN required_role = 'admin' THEN 
      role = 'admin'
    ELSE false
  END
  FROM public.users WHERE id = auth.uid();
$$;

-- Step 6: Recreate RLS policies that were dropped
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (user_has_role('admin'::user_role));

-- Step 7: Update handle_new_user function to assign employee role correctly
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
    -- Assign manager role for @custom-maids.co emails, employee for all others
    CASE 
      WHEN NEW.email LIKE '%@custom-maids.co' THEN 'manager'::public.user_role
      ELSE 'employee'::public.user_role
    END,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 8: Update user_has_permission function to work with new role hierarchy
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
    -- Employee permissions  
    WHEN role = 'employee' AND permission_name = 'VIEW_FINANCES' THEN true
    ELSE false
  END
  FROM public.users WHERE id = auth.uid();
$$;