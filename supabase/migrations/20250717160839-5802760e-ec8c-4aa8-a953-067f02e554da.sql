-- Update handle_new_user function to assign roles based on email domain
-- @custom-maids.co emails get manager role, all others get employee role

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
    -- Assign manager role for @custom-maids.co emails, employee for all others
    CASE 
      WHEN NEW.email LIKE '%@custom-maids.co' THEN 'manager'::public.employee_role
      ELSE 'employee'::public.employee_role
    END,
    true
  );
  RETURN NEW;
END;
$$;