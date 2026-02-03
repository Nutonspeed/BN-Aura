-- Fix RLS policies for clinic_staff table
-- Allow users to see their own clinic_staff records

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own clinic staff" ON public.clinic_staff;
DROP POLICY IF EXISTS "Users can update own clinic staff" ON public.clinic_staff;

-- Create policies for clinic_staff
CREATE POLICY "Users can view own clinic staff" ON public.clinic_staff
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Service role can view all clinic staff" ON public.clinic_staff
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Allow service role to manage all records
CREATE POLICY "Service role full access" ON public.clinic_staff
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );
