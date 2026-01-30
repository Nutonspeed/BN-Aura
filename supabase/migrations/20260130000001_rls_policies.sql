-- BN-Aura: RLS Policies and JWT Claim Optimization
-- This script sets up secure multi-tenant isolation using JWT claims

-- 1. Helper Functions for JWT Claims
-- These functions extract clinic_id and role from the JWT to avoid repeated table joins
CREATE OR REPLACE FUNCTION auth.get_clinic_id() 
RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'clinic_id')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.get_role() 
RETURNS TEXT AS $$
  SELECT (auth.jwt() ->> 'role')::TEXT;
$$ LANGUAGE sql STABLE;

-- 2. RLS Policies for Clinics
-- Super admins can do everything, clinic owners can see/update their own clinic
CREATE POLICY "Super Admins access all clinics" ON public.clinics
  FOR ALL TO authenticated
  USING (auth.get_role() = 'super_admin');

CREATE POLICY "Owners access own clinic" ON public.clinics
  FOR ALL TO authenticated
  USING (id = auth.get_clinic_id());

-- 3. RLS Policies for Users (Profile)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Clinic staff can view users in their clinic" ON public.users
  FOR SELECT TO authenticated
  USING (clinic_id = auth.get_clinic_id());

-- 4. RLS Policies for Skin Analyses
CREATE POLICY "Users can view own analyses" ON public.skin_analyses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view clinic analyses" ON public.skin_analyses
  FOR SELECT TO authenticated
  USING (clinic_id = auth.get_clinic_id());

CREATE POLICY "System/Staff can insert analyses" ON public.skin_analyses
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = auth.get_clinic_id() OR 
    (auth.get_role() = 'public' AND user_id = auth.uid())
  );

-- 5. Storage Bucket Policies (Run these in SQL Editor if possible, or use Dashboard UI)
-- Note: Storage policies usually apply to the storage.objects table
-- analysis-images bucket: private access for owners and clinic staff
CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'analysis-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'analysis-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Clinic staff can view images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'analysis-images' AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = (storage.foldername(name))[1]::UUID 
    AND clinic_id = auth.get_clinic_id()
  ));
