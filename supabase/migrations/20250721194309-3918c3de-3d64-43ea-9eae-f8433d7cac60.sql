-- Create collection agencies and law firms directory
CREATE TABLE public.collection_agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('law_firm', 'collection_agency')),
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  contact_person TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_agencies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view collection agencies" 
ON public.collection_agencies 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'::text));

CREATE POLICY "Managers can manage collection agencies" 
ON public.collection_agencies 
FOR ALL 
USING (user_has_permission('EDIT_TRANSACTIONS'::text));

-- Create trigger for updated_at
CREATE TRIGGER update_collection_agencies_updated_at
BEFORE UPDATE ON public.collection_agencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();