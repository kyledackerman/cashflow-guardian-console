-- Create RLS policies for the users table to allow proper access

-- Policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy to allow users with VIEW_FINANCES permission to view all users (for user management)
CREATE POLICY "Users can view all users with permission" 
ON public.users 
FOR SELECT 
USING (user_has_permission('VIEW_FINANCES'::text));

-- Policy to allow admins to manage all users (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all users" 
ON public.users 
FOR ALL
USING (user_has_role('admin'::user_role))
WITH CHECK (user_has_role('admin'::user_role));