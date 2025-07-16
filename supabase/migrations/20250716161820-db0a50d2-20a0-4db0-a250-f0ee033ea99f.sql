-- Create function to check if user can log in based on role
CREATE OR REPLACE FUNCTION public.can_user_login(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role != 'employee' FROM public.employees WHERE id = user_id),
    false
  );
$$;