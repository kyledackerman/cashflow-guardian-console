-- Fix missing trigger for automatic employee record creation
-- This resolves the "Sign Up Failed - Database error saving new user" error

-- Recreate the trigger (in case it was missing)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate any existing auth users that don't have employee records
INSERT INTO public.employees (id, name, role, active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'name', au.email, 'Unknown User') as name,
  COALESCE((au.raw_user_meta_data ->> 'role')::employee_role, 'employee'::employee_role) as role,
  true as active
FROM auth.users au
LEFT JOIN public.employees e ON e.id = au.id
WHERE e.id IS NULL;