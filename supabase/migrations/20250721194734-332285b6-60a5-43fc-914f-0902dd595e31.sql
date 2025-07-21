-- Enhance collection agencies for lead generation
-- Add more fields for comprehensive business intelligence
ALTER TABLE public.collection_agencies 
ADD COLUMN IF NOT EXISTS business_license TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS specializations TEXT[], -- e.g., ['debt_collection', 'wage_garnishment', 'asset_recovery']
ADD COLUMN IF NOT EXISTS territory TEXT, -- geographical coverage
ADD COLUMN IF NOT EXISTS min_claim_amount NUMERIC,
ADD COLUMN IF NOT EXISTS max_claim_amount NUMERIC,
ADD COLUMN IF NOT EXISTS success_rate NUMERIC, -- percentage for lead scoring
ADD COLUMN IF NOT EXISTS last_contact_date DATE,
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'prospect', -- 'prospect', 'active', 'inactive', 'blacklisted'
ADD COLUMN IF NOT EXISTS lead_source TEXT, -- where we found them
ADD COLUMN IF NOT EXISTS annual_revenue_estimate NUMERIC,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS social_media_linkedin TEXT,
ADD COLUMN IF NOT EXISTS social_media_facebook TEXT,
ADD COLUMN IF NOT EXISTS social_media_twitter TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT, -- for sales/business development notes
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0; -- 0-100 scoring system

-- Create index for lead generation queries
CREATE INDEX IF NOT EXISTS idx_collection_agencies_lead_gen 
ON public.collection_agencies (type, relationship_status, territory, active);

-- Create index for scoring
CREATE INDEX IF NOT EXISTS idx_collection_agencies_scoring 
ON public.collection_agencies (lead_score DESC, success_rate DESC);

-- Add some sample data categories
UPDATE public.collection_agencies 
SET type = 'law_firm' 
WHERE type IS NULL AND name ILIKE '%law%';

UPDATE public.collection_agencies 
SET type = 'collection_agency' 
WHERE type IS NULL;