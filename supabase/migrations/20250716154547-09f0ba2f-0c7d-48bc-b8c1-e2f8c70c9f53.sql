-- Create employee roles enum
CREATE TYPE public.employee_role AS ENUM ('employee', 'manager', 'admin');

-- Create employee permissions enum
CREATE TYPE public.employee_permission AS ENUM (
  'VIEW_FINANCES', 
  'EDIT_TRANSACTIONS', 
  'DELETE_RECORDS', 
  'MANAGE_EMPLOYEES', 
  'APPROVE_TRANSACTIONS',
  'APPROVE_LARGE_LOANS'
);

-- Create loan status enum
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved_manager', 'approved_admin', 'rejected');

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit');

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  role employee_role NOT NULL DEFAULT 'employee',
  permissions employee_permission[] DEFAULT ARRAY[]::employee_permission[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create petty cash transactions table
CREATE TABLE public.petty_cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  type transaction_type NOT NULL,
  employee_id UUID REFERENCES public.employees(id),
  employee_name TEXT, -- For backward compatibility
  purpose TEXT, -- For backward compatibility
  notes TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee loan requests table
CREATE TABLE public.employee_loan_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  employee_name TEXT NOT NULL, -- Denormalized for easy display
  requested_amount DECIMAL(10,2) NOT NULL,
  purpose TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status loan_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee loan withdrawals table
CREATE TABLE public.employee_loan_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  employee_name TEXT NOT NULL, -- Denormalized for easy display
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  approved_by UUID REFERENCES public.employees(id),
  approved_by_name TEXT, -- Denormalized for easy display
  due_date DATE NOT NULL,
  status loan_status NOT NULL DEFAULT 'pending',
  total_outstanding_at_time DECIMAL(10,2),
  requires_interest BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee loan repayments table
CREATE TABLE public.employee_loan_repayments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  employee_name TEXT NOT NULL, -- Denormalized for easy display
  payroll_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create garnishment profiles table
CREATE TABLE public.garnishment_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  employee_name TEXT NOT NULL, -- Denormalized for easy display
  creditor TEXT NOT NULL,
  court_district TEXT NOT NULL,
  case_number TEXT NOT NULL,
  law_firm TEXT NOT NULL,
  total_amount_owed DECIMAL(10,2) NOT NULL,
  amount_paid_so_far DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_remaining DECIMAL(10,2) GENERATED ALWAYS AS (total_amount_owed - amount_paid_so_far) STORED,
  notes TEXT,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create garnishment installments table
CREATE TABLE public.garnishment_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.garnishment_profiles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id),
  employee_name TEXT NOT NULL, -- Denormalized for easy display
  payroll_date DATE NOT NULL,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  check_number TEXT,
  recorded_by UUID REFERENCES public.employees(id),
  recorded_by_name TEXT, -- Denormalized for easy display
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create garnishment documents table for file metadata
CREATE TABLE public.garnishment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.garnishment_profiles(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES public.garnishment_installments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES public.employees(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_single_reference CHECK (
    (profile_id IS NOT NULL AND installment_id IS NULL) OR 
    (profile_id IS NULL AND installment_id IS NOT NULL)
  )
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('garnishment-documents', 'garnishment-documents', false);

-- Enable Row Level Security on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_loan_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garnishment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garnishment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garnishment_documents ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role and permissions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS employee_role AS $$
  SELECT role FROM public.employees WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name employee_permission)
RETURNS BOOLEAN AS $$
  SELECT permission_name = ANY(permissions) FROM public.employees WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for employees table
CREATE POLICY "Users can view all employees" ON public.employees
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage employees" ON public.employees
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for petty cash transactions
CREATE POLICY "Users with VIEW_FINANCES can view petty cash" ON public.petty_cash_transactions
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can create petty cash" ON public.petty_cash_transactions
  FOR INSERT WITH CHECK (public.user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can update petty cash" ON public.petty_cash_transactions
  FOR UPDATE USING (public.user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Users with DELETE_RECORDS can delete petty cash" ON public.petty_cash_transactions
  FOR DELETE USING (public.user_has_permission('DELETE_RECORDS'));

-- RLS Policies for employee loan requests
CREATE POLICY "Users can view loan requests" ON public.employee_loan_requests
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users can create loan requests" ON public.employee_loan_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can update loan requests" ON public.employee_loan_requests
  FOR UPDATE USING (public.get_current_user_role() IN ('manager', 'admin'));

-- RLS Policies for employee loan withdrawals
CREATE POLICY "Users can view loan withdrawals" ON public.employee_loan_withdrawals
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can create withdrawals" ON public.employee_loan_withdrawals
  FOR INSERT WITH CHECK (public.user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can update withdrawals" ON public.employee_loan_withdrawals
  FOR UPDATE USING (public.user_has_permission('EDIT_TRANSACTIONS'));

-- RLS Policies for employee loan repayments
CREATE POLICY "Users can view loan repayments" ON public.employee_loan_repayments
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can manage repayments" ON public.employee_loan_repayments
  FOR ALL USING (public.user_has_permission('EDIT_TRANSACTIONS'));

-- RLS Policies for garnishment profiles
CREATE POLICY "Users can view garnishment profiles" ON public.garnishment_profiles
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can manage profiles" ON public.garnishment_profiles
  FOR ALL USING (public.user_has_permission('EDIT_TRANSACTIONS'));

-- RLS Policies for garnishment installments
CREATE POLICY "Users can view garnishment installments" ON public.garnishment_installments
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can manage installments" ON public.garnishment_installments
  FOR ALL USING (public.user_has_permission('EDIT_TRANSACTIONS'));

-- RLS Policies for garnishment documents
CREATE POLICY "Users can view garnishment documents" ON public.garnishment_documents
  FOR SELECT USING (public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users with EDIT_TRANSACTIONS can manage documents" ON public.garnishment_documents
  FOR ALL USING (public.user_has_permission('EDIT_TRANSACTIONS'));

-- Storage policies for garnishment documents
CREATE POLICY "Users can view garnishment files" ON storage.objects
  FOR SELECT USING (bucket_id = 'garnishment-documents' AND public.user_has_permission('VIEW_FINANCES'));

CREATE POLICY "Users can upload garnishment files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'garnishment-documents' AND public.user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Users can update garnishment files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'garnishment-documents' AND public.user_has_permission('EDIT_TRANSACTIONS'));

CREATE POLICY "Users can delete garnishment files" ON storage.objects
  FOR DELETE USING (bucket_id = 'garnishment-documents' AND public.user_has_permission('DELETE_RECORDS'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_petty_cash_updated_at BEFORE UPDATE ON public.petty_cash_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_requests_updated_at BEFORE UPDATE ON public.employee_loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_withdrawals_updated_at BEFORE UPDATE ON public.employee_loan_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_repayments_updated_at BEFORE UPDATE ON public.employee_loan_repayments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garnishment_profiles_updated_at BEFORE UPDATE ON public.garnishment_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garnishment_installments_updated_at BEFORE UPDATE ON public.garnishment_installments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_employees_role ON public.employees(role);
CREATE INDEX idx_petty_cash_date ON public.petty_cash_transactions(date);
CREATE INDEX idx_petty_cash_employee ON public.petty_cash_transactions(employee_id);
CREATE INDEX idx_loan_requests_employee ON public.employee_loan_requests(employee_id);
CREATE INDEX idx_loan_requests_status ON public.employee_loan_requests(status);
CREATE INDEX idx_loan_withdrawals_employee ON public.employee_loan_withdrawals(employee_id);
CREATE INDEX idx_loan_withdrawals_date ON public.employee_loan_withdrawals(date);
CREATE INDEX idx_loan_repayments_employee ON public.employee_loan_repayments(employee_id);
CREATE INDEX idx_loan_repayments_date ON public.employee_loan_repayments(payroll_date);
CREATE INDEX idx_garnishment_profiles_employee ON public.garnishment_profiles(employee_id);
CREATE INDEX idx_garnishment_installments_profile ON public.garnishment_installments(profile_id);
CREATE INDEX idx_garnishment_installments_date ON public.garnishment_installments(payroll_date);
CREATE INDEX idx_garnishment_documents_profile ON public.garnishment_documents(profile_id);
CREATE INDEX idx_garnishment_documents_installment ON public.garnishment_documents(installment_id);