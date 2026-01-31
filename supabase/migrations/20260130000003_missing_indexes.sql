-- BN-Aura: Performance Optimization Indexes (Non-Concurrent)
-- Critical indexes for Multi-tenant RLS performance
-- Note: Some indexes already exist, will use IF NOT EXISTS to avoid conflicts

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
CREATE INDEX IF NOT EXISTS idx_sales_leads_clinic_id ON public.sales_leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_to ON public.sales_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON public.sales_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_proposals_clinic_id ON public.sales_proposals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_lead_id ON public.sales_proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_status ON public.sales_proposals(status);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_created_at ON public.sales_proposals(created_at DESC);

-- 5. Customer Management - Sales staff access
CREATE INDEX IF NOT EXISTS idx_customers_clinic_id ON public.customers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_sales_id ON public.customers(assigned_sales_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);

-- 6. Appointments & Operations
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON public.appointments(datetime);

-- 7. Compound Indexes for Common Query Patterns
CREATE INDEX IF NOT EXISTS idx_sales_leads_clinic_status ON public.sales_leads(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_clinic_user ON public.skin_analyses(clinic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_customers_clinic_sales ON public.customers(clinic_id, assigned_sales_id);
