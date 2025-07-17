-- Phase 1: Create new user_role enum and users table
CREATE TYPE public.user_role AS ENUM ('user', 'manager', 'admin');

CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Copy data from employees to users table with role mapping
INSERT INTO public.users (id, name, role, active, created_at, updated_at)
SELECT 
  id, 
  name,
  CASE 
    WHEN role = 'employee' THEN 'user'::public.user_role
    WHEN role = 'manager' THEN 'manager'::public.user_role  
    WHEN role = 'admin' THEN 'admin'::public.user_role
    ELSE 'user'::public.user_role
  END as role,
  active,
  created_at,
  updated_at
FROM public.employees;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;