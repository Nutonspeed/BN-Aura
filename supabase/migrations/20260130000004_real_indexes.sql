-- BN-Aura: Performance Indexes for Existing Tables Only
-- Based on actual database schema inspection

-- 1. Users table - Most queried for RLS
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. Clinic Staff mapping - Critical for role-based access
CREATE INDEX IF NOT EXISTS idx_clinic_staff_clinic_id ON public.clinic_staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_user_id ON public.clinic_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_staff_role ON public.clinic_staff(role);

-- 3. Skin Analyses - High query frequency
CREATE INDEX IF NOT EXISTS idx_skin_analyses_clinic_id ON public.skin_analyses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_user_id ON public.skin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_created_at ON public.skin_analyses(created_at DESC);

-- 4. Sales & CRM Tables - Business critical
-- Note: sales_leads uses 'sales_user_id' not 'assigned_to'
CREATE INDEX IF NOT EXISTS idx_sales_leads_clinic_id ON public.sales_leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_sales_user_id ON public.sales_leads(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON public.sales_leads(created_at DESC);

-- Note: sales_proposals uses 'sales_user_id' not 'assigned_to'
CREATE INDEX IF NOT EXISTS idx_sales_proposals_clinic_id ON public.sales_proposals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_lead_id ON public.sales_proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_sales_user_id ON public.sales_proposals(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_status ON public.sales_proposals(status);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_created_at ON public.sales_proposals(created_at DESC);

-- 5. Compound Indexes for Common Query Patterns
CREATE INDEX IF NOT EXISTS idx_sales_leads_clinic_status ON public.sales_leads(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_clinic_user ON public.skin_analyses(clinic_id, user_id);

-- 6. Additional useful indexes
CREATE INDEX IF NOT EXISTS idx_treatment_recommendations_analysis_id ON public.treatment_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_id ON public.branch_inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_clinic_id ON public.appointment_slots(clinic_id);
