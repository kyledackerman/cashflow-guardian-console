-- Add automatic garnishment balance calculation triggers and improvements
-- First drop the generated column and recreate as regular column

-- Add status column to garnishment_profiles
ALTER TABLE public.garnishment_profiles 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended'));

-- Drop the generated balance_remaining column and recreate as regular column
ALTER TABLE public.garnishment_profiles 
DROP COLUMN balance_remaining;

ALTER TABLE public.garnishment_profiles 
ADD COLUMN balance_remaining NUMERIC DEFAULT 0;

-- Create function to automatically update garnishment profile totals
CREATE OR REPLACE FUNCTION public.update_garnishment_profile_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the garnishment profile with current totals
  UPDATE public.garnishment_profiles 
  SET 
    amount_paid_so_far = COALESCE((
      SELECT SUM(amount) 
      FROM public.garnishment_installments 
      WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
    ), 0),
    balance_remaining = total_amount_owed - COALESCE((
      SELECT SUM(amount) 
      FROM public.garnishment_installments 
      WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);

  -- Auto-update status to completed if balance is zero or negative
  UPDATE public.garnishment_profiles 
  SET status = 'completed'
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id) 
    AND balance_remaining <= 0 
    AND status != 'completed';

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update profile totals when installments change
CREATE TRIGGER update_garnishment_totals_after_insert
  AFTER INSERT ON public.garnishment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_garnishment_profile_totals();

CREATE TRIGGER update_garnishment_totals_after_update
  AFTER UPDATE ON public.garnishment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_garnishment_profile_totals();

CREATE TRIGGER update_garnishment_totals_after_delete
  AFTER DELETE ON public.garnishment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_garnishment_profile_totals();

-- Add data integrity constraints
ALTER TABLE public.garnishment_installments 
ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

ALTER TABLE public.garnishment_profiles 
ADD CONSTRAINT check_positive_total_owed CHECK (total_amount_owed > 0);

-- Update existing profiles to have correct calculated values
UPDATE public.garnishment_profiles 
SET 
  amount_paid_so_far = COALESCE((
    SELECT SUM(amount) 
    FROM public.garnishment_installments 
    WHERE profile_id = garnishment_profiles.id
  ), 0),
  balance_remaining = total_amount_owed - COALESCE((
    SELECT SUM(amount) 
    FROM public.garnishment_installments 
    WHERE profile_id = garnishment_profiles.id
  ), 0);

-- Update status for completed garnishments
UPDATE public.garnishment_profiles 
SET status = 'completed' 
WHERE balance_remaining <= 0;