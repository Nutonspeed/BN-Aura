-- Safe Workflow System Migration
-- ใช้กับฐานข้อมูลที่มี customers, notifications อยู่แล้ว

-- WORKFLOW STATES TABLE
CREATE TABLE IF NOT EXISTS workflow_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Current State
  current_stage VARCHAR(50) NOT NULL DEFAULT 'lead_created',
  assigned_sales_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_beautician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Data Context
  scan_results JSONB DEFAULT '{}',
  treatment_plan JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_stage CHECK (current_stage IN (
    'lead_created', 'scanned', 'proposal_sent', 'payment_confirmed',
    'treatment_scheduled', 'in_treatment', 'treatment_completed',
    'follow_up', 'completed'
  ))
);

-- WORKFLOW ACTIONS TABLE
CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  from_stage VARCHAR(50) NOT NULL,
  to_stage VARCHAR(50) NOT NULL,
  data JSONB DEFAULT '{}',
  notes TEXT,
  
  CONSTRAINT valid_action_type CHECK (type IN (
    'scan_customer', 'send_proposal', 'confirm_payment',
    'schedule_appointment', 'start_treatment', 'complete_treatment',
    'send_follow_up', 'close_case'
  ))
);

-- TASK QUEUE TABLE
CREATE TABLE IF NOT EXISTS task_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  task_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- WORKFLOW EVENTS TABLE
CREATE TABLE IF NOT EXISTS workflow_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  target_users UUID[] DEFAULT '{}',
  broadcast BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTOMATION RULES TABLE
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  trigger_stage VARCHAR(50) NOT NULL,
  trigger_action VARCHAR(50),
  conditions JSONB DEFAULT '{}',
  target_action VARCHAR(50) NOT NULL,
  target_data JSONB DEFAULT '{}',
  delay_minutes INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTEND EXISTING NOTIFICATIONS TABLE
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT false;

-- Add constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_notification_priority'
  ) THEN
    ALTER TABLE notifications 
    ADD CONSTRAINT valid_notification_priority 
    CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_states_clinic_stage ON workflow_states(clinic_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_workflow_states_customer ON workflow_states(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_assigned_sales ON workflow_states(assigned_sales_id) WHERE assigned_sales_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_states_updated ON workflow_states(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow ON workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_performed ON workflow_actions(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_queue_assigned ON task_queue(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON task_queue(priority, due_date);

CREATE INDEX IF NOT EXISTS idx_workflow_events_workflow ON workflow_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_processed ON workflow_events(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Row Level Security
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view workflows in their clinic" ON workflow_states
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage workflows in their clinic" ON workflow_states
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view workflow actions in their clinic" ON workflow_actions
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflow_states WHERE clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create workflow actions" ON workflow_actions
  FOR INSERT WITH CHECK (
    workflow_id IN (
      SELECT id FROM workflow_states WHERE clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their tasks" ON task_queue
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    workflow_id IN (
      SELECT id FROM workflow_states WHERE clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage tasks in their clinic" ON task_queue
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflow_states WHERE clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION get_workflow_stats(clinic_uuid UUID)
RETURNS TABLE (
  stage VARCHAR(50),
  count BIGINT,
  avg_duration_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.current_stage,
    COUNT(*) as count,
    ROUND(AVG(EXTRACT(EPOCH FROM (w.updated_at - w.created_at))/3600), 2) as avg_duration_hours
  FROM workflow_states w
  WHERE w.clinic_id = clinic_uuid
    AND w.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY w.current_stage
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-assign task trigger
CREATE OR REPLACE FUNCTION auto_assign_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stage = 'scanned' AND OLD.current_stage = 'lead_created' THEN
    INSERT INTO task_queue (workflow_id, assigned_to, task_type, title, description, priority, due_date)
    SELECT 
      NEW.id,
      NEW.assigned_sales_id,
      'send_proposal',
      'ส่งใบเสนอราคาให้ลูกค้า',
      'สร้างและส่งใบเสนอราคาจากผลสแกนผิว',
      'high',
      NOW() + INTERVAL '2 hours'
    WHERE NEW.assigned_sales_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_state_changed
  AFTER UPDATE ON workflow_states
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_task();
