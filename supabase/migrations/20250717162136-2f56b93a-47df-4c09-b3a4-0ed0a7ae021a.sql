-- Priority 1 Data Integrity Improvements for Garnishment System

-- 1. Add case number uniqueness constraint
ALTER TABLE public.garnishment_profiles 
ADD CONSTRAINT unique_case_number UNIQUE (case_number);

-- 2. Add constraint to prevent duplicate payments on same payroll date for same profile
ALTER TABLE public.garnishment_installments 
ADD CONSTRAINT unique_profile_payroll_date UNIQUE (profile_id, payroll_date);

-- 3. Create enhanced validation function for installment amounts
CREATE OR REPLACE FUNCTION public.validate_garnishment_installment()
RETURNS TRIGGER AS $$
DECLARE
  profile_balance NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Get current profile balance
  SELECT balance_remaining INTO profile_balance
  FROM public.garnishment_profiles 
  WHERE id = NEW.profile_id;
  
  -- Validate amount doesn't exceed remaining balance
  IF NEW.amount > profile_balance THEN
    RAISE EXCEPTION 'Payment amount %.2f exceeds remaining balance %.2f', 
      NEW.amount, profile_balance;
  END IF;
  
  -- Validate amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for installment validation
CREATE TRIGGER validate_installment_before_insert
  BEFORE INSERT ON public.garnishment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_garnishment_installment();

-- 5. Add validation for profile data integrity
CREATE OR REPLACE FUNCTION public.validate_garnishment_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate total amount owed is positive
  IF NEW.total_amount_owed <= 0 THEN
    RAISE EXCEPTION 'Total amount owed must be greater than zero';
  END IF;
  
  -- Ensure case number is not empty
  IF NEW.case_number IS NULL OR trim(NEW.case_number) = '' THEN
    RAISE EXCEPTION 'Case number is required';
  END IF;
  
  -- Ensure creditor is not empty
  IF NEW.creditor IS NULL OR trim(NEW.creditor) = '' THEN
    RAISE EXCEPTION 'Creditor name is required';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for profile validation
CREATE TRIGGER validate_profile_before_insert_update
  BEFORE INSERT OR UPDATE ON public.garnishment_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_garnishment_profile();