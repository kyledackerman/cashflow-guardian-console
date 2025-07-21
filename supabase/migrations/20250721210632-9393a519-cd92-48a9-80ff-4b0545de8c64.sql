
-- Fix balance_remaining calculation for garnishment profiles

-- First, update the default value for balance_remaining to NULL instead of 0
ALTER TABLE public.garnishment_profiles 
ALTER COLUMN balance_remaining SET DEFAULT NULL;

-- Update existing profiles to have correct calculated balance_remaining values
UPDATE public.garnishment_profiles 
SET balance_remaining = total_amount_owed - COALESCE(amount_paid_so_far, 0)
WHERE balance_remaining = 0 AND amount_paid_so_far < total_amount_owed;

-- Also update the autofill trigger to ensure it calculates balance for new profiles
CREATE OR REPLACE FUNCTION public.autofill_garnishment_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set balance_remaining if not provided or is NULL
  IF NEW.balance_remaining IS NULL THEN
    NEW.balance_remaining := NEW.total_amount_owed - COALESCE(NEW.amount_paid_so_far, 0);
  END IF;
  
  -- Auto-set next_due_date to 30 days from now if not provided
  IF NEW.next_due_date IS NULL THEN
    NEW.next_due_date := CURRENT_DATE + INTERVAL '30 days';
  END IF;
  
  -- Auto-set compliance_status if not provided
  IF NEW.compliance_status IS NULL THEN
    NEW.compliance_status := 'active';
  END IF;
  
  -- Auto-set status if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
