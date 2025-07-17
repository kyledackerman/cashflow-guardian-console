-- Add compliance tracking fields to garnishment_profiles
ALTER TABLE public.garnishment_profiles 
ADD COLUMN next_due_date DATE,
ADD COLUMN compliance_notes TEXT,
ADD COLUMN compliance_status TEXT DEFAULT 'active';

-- Add document category enum and update garnishment_documents
CREATE TYPE public.document_category AS ENUM (
  'court_order',
  'service_documentation', 
  'payment_confirmation',
  'correspondence',
  'other'
);

ALTER TABLE public.garnishment_documents 
ADD COLUMN category public.document_category DEFAULT 'other';

-- Add index for better performance on compliance queries
CREATE INDEX idx_garnishment_profiles_next_due_date ON public.garnishment_profiles(next_due_date);
CREATE INDEX idx_garnishment_documents_category ON public.garnishment_documents(category);