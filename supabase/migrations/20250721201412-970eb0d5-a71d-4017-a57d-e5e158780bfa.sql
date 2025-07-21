
-- Add missing triggers for garnishment installment validation and profile totals update
CREATE TRIGGER validate_garnishment_installment_trigger
  BEFORE INSERT OR UPDATE ON public.garnishment_installments
  FOR EACH ROW EXECUTE FUNCTION public.validate_garnishment_installment();

CREATE TRIGGER update_garnishment_profile_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.garnishment_installments
  FOR EACH ROW EXECUTE FUNCTION public.update_garnishment_profile_totals();

-- Add default auth.uid() for uploaded_by field in garnishment_documents
ALTER TABLE public.garnishment_documents 
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- Make sure the storage bucket has proper policies for authenticated users
CREATE POLICY "Authenticated users can upload garnishment files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'garnishment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view garnishment files" ON storage.objects
  FOR SELECT USING (bucket_id = 'garnishment-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete garnishment files" ON storage.objects
  FOR DELETE USING (bucket_id = 'garnishment-documents' AND auth.role() = 'authenticated');
