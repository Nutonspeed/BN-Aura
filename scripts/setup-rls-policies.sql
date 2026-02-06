-- Row Level Security (RLS) Policies Setup for BN-Aura
-- Run this after creating all tables to enable proper security

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

-- Core System Tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Customer Management
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

-- Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;

-- Inventory
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Billing
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- AI & Analytics
ALTER TABLE ai_skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Communication
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- System
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE HELPER FUNCTIONS
-- ============================================

-- Get user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get user's clinic_id
CREATE OR REPLACE FUNCTION auth.user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is admin or super admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('super_admin', 'admin') FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 3. CORE POLICIES
-- ============================================

-- CLINICS: Super admins see all, others see only their clinic
CREATE POLICY "clinics_select" ON clinics
  FOR SELECT USING (
    auth.is_super_admin() OR id = auth.user_clinic_id()
  );

CREATE POLICY "clinics_insert" ON clinics
  FOR INSERT WITH CHECK (auth.is_super_admin());

CREATE POLICY "clinics_update" ON clinics
  FOR UPDATE USING (
    auth.is_super_admin() OR (id = auth.user_clinic_id() AND auth.is_admin())
  );

-- USERS: Users can see users in their clinic
CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    auth.is_super_admin() OR 
    clinic_id = auth.user_clinic_id() OR 
    id = auth.uid()
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    id = auth.uid() OR 
    (auth.is_admin() AND clinic_id = auth.user_clinic_id())
  );

-- CUSTOMERS: Scoped to clinic
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (
    auth.is_super_admin() OR clinic_id = auth.user_clinic_id()
  );

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (
    clinic_id = auth.user_clinic_id()
  );

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (
    clinic_id = auth.user_clinic_id()
  );

-- APPOINTMENTS: Scoped to clinic
CREATE POLICY "appointments_select" ON appointments
  FOR SELECT USING (
    auth.is_super_admin() OR clinic_id = auth.user_clinic_id()
  );

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT WITH CHECK (
    clinic_id = auth.user_clinic_id()
  );

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE USING (
    clinic_id = auth.user_clinic_id()
  );

-- SERVICES: Scoped to clinic
CREATE POLICY "services_select" ON services
  FOR SELECT USING (
    auth.is_super_admin() OR clinic_id = auth.user_clinic_id()
  );

CREATE POLICY "services_insert" ON services
  FOR INSERT WITH CHECK (
    clinic_id = auth.user_clinic_id()
  );

-- INVOICES: Scoped to clinic
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    auth.is_super_admin() OR clinic_id = auth.user_clinic_id()
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    clinic_id = auth.user_clinic_id()
  );

-- NOTIFICATIONS: Users see only their notifications
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- AUDIT_LOGS: Admins and super admins only
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    auth.is_admin() OR auth.is_super_admin()
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true); -- System can always insert

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
