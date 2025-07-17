-- Critical Fix: Update trigger to use users table instead of employees table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to insert into users table
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
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate insertions
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate any existing auth users that don't have user records
INSERT INTO public.users (id, name, role, active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'name', au.email, 'Unknown User') as name,
  CASE 
    WHEN au.email LIKE '%@custom-maids.co' THEN 'manager'::public.user_role
    ELSE 'user'::public.user_role
  END as role,
  true as active
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;