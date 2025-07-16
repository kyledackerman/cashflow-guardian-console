-- Fix handle_new_user function to use fully qualified type names
-- This resolves the "Sign Up Failed - Database error saving new user" error

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
    -- Use fully qualified type name to work with empty search_path
    'employee'::public.employee_role,
    true
  );
  RETURN NEW;
END;
$$;