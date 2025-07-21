-- Remove all business intelligence and lead generation references
-- This system should just be a simple data management tool, not for lead generation

-- Remove business intelligence fields from collection agencies
ALTER TABLE public.collection_agencies 
DROP COLUMN IF EXISTS business_license,
DROP COLUMN IF EXISTS tax_id,
DROP COLUMN IF EXISTS specializations,
DROP COLUMN IF EXISTS territory,
DROP COLUMN IF EXISTS min_claim_amount,
DROP COLUMN IF EXISTS max_claim_amount,
DROP COLUMN IF EXISTS success_rate,
DROP COLUMN IF EXISTS last_contact_date,
DROP COLUMN IF EXISTS relationship_status,
DROP COLUMN IF EXISTS lead_source,
DROP COLUMN IF EXISTS annual_revenue_estimate,
DROP COLUMN IF EXISTS employee_count,
DROP COLUMN IF EXISTS founded_year,
DROP COLUMN IF EXISTS internal_notes,
DROP COLUMN IF EXISTS lead_score;

-- Drop the business intelligence indexes as they're no longer needed
DROP INDEX IF EXISTS idx_collection_agencies_lead_gen;
DROP INDEX IF EXISTS idx_collection_agencies_scoring;

-- Update table comment to reflect its actual purpose
COMMENT ON TABLE public.collection_agencies IS 'Contact information for creditors, law firms, and collection agencies for operational purposes';