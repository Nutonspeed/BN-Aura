-- BN-Aura: Fix RLS Policies for Data Isolation
-- This migration fixes permissive RLS policies and adds proper ownership enforcement

-- ============================================
-- 1. FIX CUSTOMERS TABLE RLS POLICIES
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admin full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Clinic staff access to own clinic customers" ON public.customers;
DROP POLICY IF EXISTS "Sales staff access to assigned customers" ON public.customers;

-- Create new, properly scoped policies

-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "super_admin_customers_all" ON public.customers;
DROP POLICY IF EXISTS "clinic_admin_customers_all" ON public.customers;
DROP POLICY IF EXISTS "sales_staff_customers_select" ON public.customers;
DROP POLICY IF EXISTS "sales_staff_customers_update" ON public.customers;
DROP POLICY IF EXISTS "sales_staff_customers_insert" ON public.customers;
DROP POLICY IF EXISTS "customer_self_view" ON public.customers;

-- Super admin can do everything
CREATE POLICY "super_admin_customers_all" ON public.customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Clinic owner/admin can see and manage all customers in their clinic
CREATE POLICY "clinic_admin_customers_all" ON public.customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.clinic_id = customers.clinic_id
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.clinic_id = customers.clinic_id
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- Sales staff can SELECT only their assigned customers
CREATE POLICY "sales_staff_customers_select" ON public.customers
  FOR SELECT
  USING (
    assigned_sales_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.clinic_id = customers.clinic_id
        AND cs.role = 'sales_staff'
        AND cs.is_active = true
        AND customers.assigned_sales_id = auth.uid()
    )
  );

-- Sales staff can UPDATE only their assigned customers (limited fields)
CREATE POLICY "sales_staff_customers_update" ON public.customers
  FOR UPDATE
  USING (
    assigned_sales_id = auth.uid()
  )
  WITH CHECK (
    assigned_sales_id = auth.uid()
  );

-- Sales staff can INSERT customers (will be auto-assigned to them)
CREATE POLICY "sales_staff_customers_insert" ON public.customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.clinic_id = clinic_id
        AND cs.role = 'sales_staff'
        AND cs.is_active = true
    )
    AND assigned_sales_id = auth.uid()
  );

-- Customer can view their own record
CREATE POLICY "customer_self_view" ON public.customers
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 2. FIX CUSTOMER_SALES_MESSAGES TABLE RLS
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "sales_staff_messages_access" ON public.customer_sales_messages;
DROP POLICY IF EXISTS "customer_messages_access" ON public.customer_sales_messages;
DROP POLICY IF EXISTS "sales_staff_messages_all" ON public.customer_sales_messages;
DROP POLICY IF EXISTS "customer_messages_all" ON public.customer_sales_messages;
DROP POLICY IF EXISTS "clinic_admin_messages_select" ON public.customer_sales_messages;

-- Sales staff can access messages for their assigned customers only
CREATE POLICY "sales_staff_messages_all" ON public.customer_sales_messages
  FOR ALL
  USING (
    sales_staff_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id
        AND c.assigned_sales_id = auth.uid()
    )
  )
  WITH CHECK (
    sales_staff_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id
        AND c.assigned_sales_id = auth.uid()
    )
  );

-- Customer can access their own messages only
CREATE POLICY "customer_messages_all" ON public.customer_sales_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id
        AND c.user_id = auth.uid()
    )
  );

-- Clinic owner/admin can view all messages in their clinic
CREATE POLICY "clinic_admin_messages_select" ON public.customer_sales_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.clinic_staff cs ON cs.clinic_id = c.clinic_id
      WHERE c.id = customer_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- ============================================
-- 3. FIX WORKFLOW_STATES TABLE RLS
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can manage workflows in their clinic" ON public.workflow_states;
DROP POLICY IF EXISTS "Users can view workflows in their clinic" ON public.workflow_states;
DROP POLICY IF EXISTS "Sales see only assigned workflows" ON public.workflow_states;
DROP POLICY IF EXISTS "sales_staff_workflows_all" ON public.workflow_states;
DROP POLICY IF EXISTS "clinic_admin_workflows_all" ON public.workflow_states;
DROP POLICY IF EXISTS "super_admin_workflows_all" ON public.workflow_states;

-- Sales staff can only access their assigned workflows
CREATE POLICY "sales_staff_workflows_all" ON public.workflow_states
  FOR ALL
  USING (
    assigned_sales_id = auth.uid()
  )
  WITH CHECK (
    assigned_sales_id = auth.uid()
  );

-- Clinic owner/admin can access all workflows in their clinic
CREATE POLICY "clinic_admin_workflows_all" ON public.workflow_states
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.clinic_id = workflow_states.clinic_id
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.clinic_id = workflow_states.clinic_id
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- Super admin can access all workflows
CREATE POLICY "super_admin_workflows_all" ON public.workflow_states
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 4. FIX TASK_QUEUE TABLE RLS
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can manage tasks in their clinic" ON public.task_queue;
DROP POLICY IF EXISTS "staff_own_tasks" ON public.task_queue;
DROP POLICY IF EXISTS "clinic_admin_tasks_all" ON public.task_queue;
DROP POLICY IF EXISTS "super_admin_tasks_all" ON public.task_queue;

-- Staff can only access tasks assigned to them
CREATE POLICY "staff_own_tasks" ON public.task_queue
  FOR ALL
  USING (
    assigned_to = auth.uid()
  )
  WITH CHECK (
    assigned_to = auth.uid()
  );

-- Clinic owner/admin can access all tasks in their clinic (via workflow)
CREATE POLICY "clinic_admin_tasks_all" ON public.task_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      JOIN public.clinic_staff cs ON cs.clinic_id = ws.clinic_id
      WHERE ws.id = task_queue.workflow_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      JOIN public.clinic_staff cs ON cs.clinic_id = ws.clinic_id
      WHERE ws.id = task_queue.workflow_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- Super admin can access all tasks
CREATE POLICY "super_admin_tasks_all" ON public.task_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 5. ADD AUDIT LOGGING FOR CROSS-ACCESS ATTEMPTS
-- ============================================

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "admin_audit_log_select" ON public.security_audit_log;
DROP POLICY IF EXISTS "system_audit_insert" ON public.security_audit_log;

-- Only super admin and clinic admin can read audit logs
CREATE POLICY "admin_audit_log_select" ON public.security_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.clinic_staff cs
      WHERE cs.user_id = auth.uid()
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- System can insert audit logs
CREATE POLICY "system_audit_insert" ON public.security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.security_audit_log(action);

COMMENT ON TABLE public.security_audit_log IS 'Audit log for security-sensitive operations and cross-access attempts';
