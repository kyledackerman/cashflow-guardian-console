-- Add triggers for auto-filling garnishment data

-- Trigger to auto-populate garnishment profile fields on insert
CREATE OR REPLACE FUNCTION public.autofill_garnishment_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-set balance_remaining if not provided
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
$function$;

-- Trigger to auto-populate installment fields
CREATE OR REPLACE FUNCTION public.autofill_garnishment_installment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_record RECORD;
  max_installment_num INTEGER;
BEGIN
  -- Get profile information
  SELECT * INTO profile_record 
  FROM public.garnishment_profiles 
  WHERE id = NEW.profile_id;
  
  -- Auto-set employee_id and employee_name from profile if not provided
  IF NEW.employee_id IS NULL THEN
    NEW.employee_id := profile_record.employee_id;
  END IF;
  
  IF NEW.employee_name IS NULL OR NEW.employee_name = '' THEN
    NEW.employee_name := profile_record.employee_name;
  END IF;
  
  -- Auto-set installment_number if not provided
  IF NEW.installment_number IS NULL THEN
    SELECT COALESCE(MAX(installment_number), 0) + 1 
    INTO max_installment_num
    FROM public.garnishment_installments 
    WHERE profile_id = NEW.profile_id;
    
    NEW.installment_number := max_installment_num;
  END IF;
  
  -- Auto-set recorded_by and recorded_by_name if not provided
  IF NEW.recorded_by IS NULL THEN
    NEW.recorded_by := auth.uid();
  END IF;
  
  IF NEW.recorded_by_name IS NULL OR NEW.recorded_by_name = '' THEN
    NEW.recorded_by_name := COALESCE(
      (SELECT name FROM public.users WHERE id = auth.uid()),
      'Unknown User'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Add triggers to tables
CREATE TRIGGER autofill_garnishment_profile_trigger
  BEFORE INSERT OR UPDATE ON public.garnishment_profiles
  FOR EACH ROW EXECUTE FUNCTION public.autofill_garnishment_profile();

CREATE TRIGGER autofill_garnishment_installment_trigger
  BEFORE INSERT ON public.garnishment_installments
  FOR EACH ROW EXECUTE FUNCTION public.autofill_garnishment_installment();

-- Update existing update_garnishment_profile_totals trigger to also auto-update next_due_date
CREATE OR REPLACE FUNCTION public.update_garnishment_profile_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  calculated_paid NUMERIC;
  calculated_balance NUMERIC;
  latest_payment_date DATE;
BEGIN
  -- Calculate totals for the profile
  SELECT COALESCE(SUM(amount), 0), MAX(payroll_date)
  INTO calculated_paid, latest_payment_date
  FROM public.garnishment_installments 
  WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id);
  
  calculated_balance := (
    SELECT total_amount_owed 
    FROM public.garnishment_profiles 
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id)
  ) - calculated_paid;
  
  -- Update the garnishment profile with current totals
  UPDATE public.garnishment_profiles 
  SET 
    amount_paid_so_far = calculated_paid,
    balance_remaining = calculated_balance,
    next_due_date = CASE 
      WHEN latest_payment_date IS NOT NULL THEN latest_payment_date + INTERVAL '30 days'
      ELSE next_due_date
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);

  -- Auto-update status to completed if balance is zero or negative
  UPDATE public.garnishment_profiles 
  SET status = 'completed'
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id) 
    AND calculated_balance <= 0 
    AND status != 'completed';

  RETURN COALESCE(NEW, OLD);
END;
$function$;