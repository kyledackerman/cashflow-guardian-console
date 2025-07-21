
-- Fix the validation function to calculate remaining balance correctly
CREATE OR REPLACE FUNCTION public.validate_garnishment_installment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_total_owed NUMERIC;
  profile_paid_so_far NUMERIC;
  calculated_balance NUMERIC;
BEGIN
  -- Get current profile totals
  SELECT total_amount_owed, amount_paid_so_far 
  INTO profile_total_owed, profile_paid_so_far
  FROM public.garnishment_profiles 
  WHERE id = NEW.profile_id;
  
  -- Calculate the actual remaining balance
  calculated_balance := profile_total_owed - COALESCE(profile_paid_so_far, 0);
  
  -- Validate amount doesn't exceed remaining balance
  IF NEW.amount > calculated_balance THEN
    RAISE EXCEPTION 'Payment amount %.2f exceeds remaining balance %.2f', 
      NEW.amount, calculated_balance;
  END IF;
  
  -- Validate amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also fix the profile totals update function to ensure balance_remaining is calculated correctly
CREATE OR REPLACE FUNCTION public.update_garnishment_profile_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_paid NUMERIC;
  calculated_balance NUMERIC;
BEGIN
  -- Calculate totals for the profile
  SELECT COALESCE(SUM(amount), 0) 
  INTO calculated_paid
  FROM public.garnishment_installments 
  WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id);
  
  -- Update the garnishment profile with current totals
  UPDATE public.garnishment_profiles 
  SET 
    amount_paid_so_far = calculated_paid,
    balance_remaining = total_amount_owed - calculated_paid,
    updated_at = now()
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);

  -- Auto-update status to completed if balance is zero or negative
  UPDATE public.garnishment_profiles 
  SET status = 'completed'
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id) 
    AND (total_amount_owed - calculated_paid) <= 0 
    AND status != 'completed';

  RETURN COALESCE(NEW, OLD);
END;
$$;
