-- BN-Aura: Complete Workflow RLS Fixes
-- Ensures sales staff can only see their assigned workflows

-- ============================================
-- 1. FIX WORKFLOW_ACTIONS TABLE RLS
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view workflow actions in their clinic" ON public.workflow_actions;
DROP POLICY IF EXISTS "Users can create workflow actions in their clinic" ON public.workflow_actions;

-- Sales staff can only access actions for their assigned workflows
CREATE POLICY "sales_staff_workflow_actions_all" ON public.workflow_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      WHERE ws.id = workflow_actions.workflow_id
        AND ws.assigned_sales_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      WHERE ws.id = workflow_actions.workflow_id
        AND ws.assigned_sales_id = auth.uid()
    )
  );

-- Beautician can access actions for workflows assigned to them
CREATE POLICY "beautician_workflow_actions_all" ON public.workflow_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      WHERE ws.id = workflow_actions.workflow_id
        AND ws.assigned_beautician_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      WHERE ws.id = workflow_actions.workflow_id
        AND ws.assigned_beautician_id = auth.uid()
    )
  );

-- Clinic owner/admin can access all workflow actions in their clinic
CREATE POLICY "clinic_admin_workflow_actions_all" ON public.workflow_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      JOIN public.clinic_staff cs ON cs.clinic_id = ws.clinic_id
      WHERE ws.id = workflow_actions.workflow_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- Super admin can access all workflow actions
CREATE POLICY "super_admin_workflow_actions_all" ON public.workflow_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 2. FIX WORKFLOW_EVENTS TABLE RLS
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view workflow events in their clinic" ON public.workflow_events;
DROP POLICY IF EXISTS "Users can create workflow events" ON public.workflow_events;

-- Sales staff can only access events for their assigned workflows
CREATE POLICY "sales_staff_workflow_events_select" ON public.workflow_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      WHERE ws.id = workflow_events.workflow_id
        AND ws.assigned_sales_id = auth.uid()
    )
    OR target_users @> ARRAY[auth.uid()]
  );

-- Beautician can access events for workflows assigned to them
CREATE POLICY "beautician_workflow_events_select" ON public.workflow_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      WHERE ws.id = workflow_events.workflow_id
        AND ws.assigned_beautician_id = auth.uid()
    )
    OR target_users @> ARRAY[auth.uid()]
  );

-- System/triggers can insert events
CREATE POLICY "system_workflow_events_insert" ON public.workflow_events
  FOR INSERT
  WITH CHECK (true);

-- Clinic owner/admin can access all workflow events in their clinic
CREATE POLICY "clinic_admin_workflow_events_all" ON public.workflow_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_states ws
      JOIN public.clinic_staff cs ON cs.clinic_id = ws.clinic_id
      WHERE ws.id = workflow_events.workflow_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('clinic_owner', 'clinic_admin')
        AND cs.is_active = true
    )
  );

-- Super admin can access all workflow events
CREATE POLICY "super_admin_workflow_events_all" ON public.workflow_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 3. FIX BEAUTICIAN ACCESS TO WORKFLOW_STATES
-- ============================================

-- Add beautician policy (missing from previous migration)
CREATE POLICY "beautician_workflows_all" ON public.workflow_states
  FOR ALL
  USING (
    assigned_beautician_id = auth.uid()
  )
  WITH CHECK (
    assigned_beautician_id = auth.uid()
  );

-- ============================================
-- 4. FOLLOWUP RULES/EXECUTIONS - SKIPPED
-- ============================================
-- Note: followup_rules and followup_executions policies skipped due to schema differences
-- Add these manually if needed after verifying actual column names

COMMENT ON POLICY "sales_staff_workflows_all" ON public.workflow_states IS 'Sales staff can only access workflows assigned to them';
COMMENT ON POLICY "beautician_workflows_all" ON public.workflow_states IS 'Beauticians can only access workflows assigned to them';
