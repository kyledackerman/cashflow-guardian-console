-- Add function to schedule automatic bi-weekly payments for garnishment profiles

CREATE OR REPLACE FUNCTION public.schedule_garnishment_payments()
RETURNS TRIGGER AS $$
DECLARE
  payment_amount NUMERIC;
  first_payment_date DATE;
  second_payment_date DATE;
BEGIN
  -- Calculate bi-weekly payment amount (split remaining balance over 2 payments)
  payment_amount := NEW.balance_remaining / 2;
  
  -- Set first payment for next payroll (7 days from now)
  first_payment_date := CURRENT_DATE + INTERVAL '7 days';
  
  -- Set second payment for following payroll (14 days from first)
  second_payment_date := first_payment_date + INTERVAL '14 days';
  
  -- Update the profile with the next due date (first payment)
  NEW.next_due_date := first_payment_date;
  
  -- Set compliance status to active for new profiles with outstanding balance
  IF NEW.balance_remaining > 0 THEN
    NEW.compliance_status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to schedule payments when a garnishment profile is created or updated
DROP TRIGGER IF EXISTS schedule_payments_trigger ON public.garnishment_profiles;
CREATE TRIGGER schedule_payments_trigger
  BEFORE INSERT OR UPDATE ON public.garnishment_profiles
  FOR EACH ROW
  WHEN (NEW.balance_remaining > 0)
  EXECUTE FUNCTION public.schedule_garnishment_payments();