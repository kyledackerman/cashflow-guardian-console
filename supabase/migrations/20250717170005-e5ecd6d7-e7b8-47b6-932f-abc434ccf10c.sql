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

-- Phase 2: Drop existing functions before recreating them with new return types
DROP FUNCTION public.get_current_user_role();
DROP FUNCTION public.user_has_permission(employee_permission);

-- Create new database functions to work with new structure
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

-- Create RLS policies for users table
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