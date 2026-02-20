-- Phase 7: Unified Workflow Engine - Database Schema
-- Migration: 20260217000001_create_workflow_tables.sql

-- Workflow States Table
CREATE TABLE IF NOT EXISTS workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL CHECK (current_stage IN ('scanned', 'treatment_scheduled', 'in_treatment', 'completed', 'follow_up')),
  assigned_sales UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_beautician UUID REFERENCES users(id) ON DELETE SET NULL,
  scan_results JSONB,
  treatment_plan JSONB,
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Events/Timeline Table
CREATE TABLE IF NOT EXISTS workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'stage_changed', 'task_assigned', 'task_completed', 'note_added', 'customer_contacted')),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT,
  event_data JSONB,
  previous_stage TEXT,
  new_stage TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Tasks Table
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('review_scan', 'prepare_treatment', 'perform_treatment', 'follow_up', 'contact_customer', 'schedule_appointment')),
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- in minutes
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Task Comments (for collaboration)
CREATE TABLE IF NOT EXISTS workflow_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_states_customer_id ON workflow_states(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_clinic_id ON workflow_states(clinic_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_current_stage ON workflow_states(current_stage);
CREATE INDEX IF NOT EXISTS idx_workflow_states_assigned_sales ON workflow_states(assigned_sales);
CREATE INDEX IF NOT EXISTS idx_workflow_states_assigned_beautician ON workflow_states(assigned_beautician);
CREATE INDEX IF NOT EXISTS idx_workflow_states_created_at ON workflow_states(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_states_updated_at ON workflow_states(updated_at);

CREATE INDEX IF NOT EXISTS idx_workflow_events_workflow_id ON workflow_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created_at ON workflow_events(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_events_actor_id ON workflow_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_event_type ON workflow_events(event_type);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_id ON workflow_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_task_type ON workflow_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_due_date ON workflow_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_created_at ON workflow_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_task_comments_task_id ON workflow_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_task_comments_author_id ON workflow_task_comments(author_id);

-- Add updated_at trigger for workflow_states
CREATE OR REPLACE FUNCTION update_workflow_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_workflow_states_updated_at
    BEFORE UPDATE ON workflow_states
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_states_updated_at();

-- Add updated_at trigger for workflow_tasks
CREATE TRIGGER trigger_update_workflow_tasks_updated_at
    BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_tasks_updated_at();

-- RLS Policies for workflow_states
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflows for their clinic" ON workflow_states
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_staff 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Sales staff can view their assigned workflows" ON workflow_states
    FOR SELECT USING (
        assigned_sales = auth.uid()
    );

CREATE POLICY "Beauticians can view their assigned workflows" ON workflow_states
    FOR SELECT USING (
        assigned_beautician = auth.uid()
    );

CREATE POLICY "Clinic owners can manage all workflows in their clinic" ON workflow_states
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM clinics 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Sales staff can update their assigned workflows" ON workflow_states
    FOR UPDATE USING (
        assigned_sales = auth.uid()
    );

CREATE POLICY "Beauticians can update their assigned workflows" ON workflow_states
    FOR UPDATE USING (
        assigned_beautician = auth.uid()
    );

-- RLS Policies for workflow_events
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events for accessible workflows" ON workflow_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workflow_states ws
            WHERE ws.id = workflow_id
            AND (
                ws.clinic_id IN (
                    SELECT clinic_id FROM clinic_staff 
                    WHERE user_id = auth.uid()
                )
                OR ws.assigned_sales = auth.uid()
                OR ws.assigned_beautician = auth.uid()
                OR ws.clinic_id IN (
                    SELECT clinic_id FROM clinics 
                    WHERE owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create events for accessible workflows" ON workflow_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workflow_states ws
            WHERE ws.id = workflow_id
            AND (
                ws.clinic_id IN (
                    SELECT clinic_id FROM clinic_staff 
                    WHERE user_id = auth.uid()
                )
                OR ws.assigned_sales = auth.uid()
                OR ws.assigned_beautician = auth.uid()
                OR ws.clinic_id IN (
                    SELECT clinic_id FROM clinics 
                    WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for workflow_tasks
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for accessible workflows" ON workflow_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workflow_states ws
            WHERE ws.id = workflow_id
            AND (
                ws.clinic_id IN (
                    SELECT clinic_id FROM clinic_staff 
                    WHERE user_id = auth.uid()
                )
                OR ws.assigned_sales = auth.uid()
                OR ws.assigned_beautician = auth.uid()
                OR ws.clinic_id IN (
                    SELECT clinic_id FROM clinics 
                    WHERE owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can view their assigned tasks" ON workflow_tasks
    FOR SELECT USING (
        assigned_to = auth.uid()
    );

CREATE POLICY "Users can update their assigned tasks" ON workflow_tasks
    FOR UPDATE USING (
        assigned_to = auth.uid()
    );

CREATE POLICY "Clinic owners can manage all tasks in their clinic" ON workflow_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workflow_states ws
            WHERE ws.id = workflow_id
            AND ws.clinic_id IN (
                SELECT clinic_id FROM clinics 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- RLS Policies for workflow_task_comments
ALTER TABLE workflow_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for accessible tasks" ON workflow_task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workflow_tasks wt
            WHERE wt.id = task_id
            AND (
                wt.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM workflow_states ws
                    WHERE ws.id = wt.workflow_id
                    AND (
                        ws.clinic_id IN (
                            SELECT clinic_id FROM clinic_staff 
                            WHERE user_id = auth.uid()
                        )
                        OR ws.assigned_sales = auth.uid()
                        OR ws.assigned_beautician = auth.uid()
                        OR ws.clinic_id IN (
                            SELECT clinic_id FROM clinics 
                            WHERE owner_id = auth.uid()
                        )
                    )
                )
            )
        )
    );

CREATE POLICY "Users can create comments for accessible tasks" ON workflow_task_comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM workflow_tasks wt
            WHERE wt.id = task_id
            AND (
                wt.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM workflow_states ws
                    WHERE ws.id = wt.workflow_id
                    AND (
                        ws.clinic_id IN (
                            SELECT clinic_id FROM clinic_staff 
                            WHERE user_id = auth.uid()
                        )
                        OR ws.assigned_sales = auth.uid()
                        OR ws.assigned_beautician = auth.uid()
                        OR ws.clinic_id IN (
                            SELECT clinic_id FROM clinics 
                            WHERE owner_id = auth.uid()
                        )
                    )
                )
            )
        )
    );

-- Insert sample data for testing (optional)
INSERT INTO workflow_states (
    customer_id,
    clinic_id,
    current_stage,
    assigned_sales,
    assigned_beautician,
    scan_results,
    treatment_plan,
    priority_level,
    notes
) SELECT 
    c.id,
    c.clinic_id,
    'scanned',
    cs.user_id,
    NULL,
    '{"skinType": "oily", "age": 35, "overallScore": 75}'::jsonb,
    '{"recommendedTreatments": ["facial", "chemical_peel"]}'::jsonb,
    'normal',
    'Customer interested in anti-aging treatments'
FROM customers c
JOIN clinic_staff cs ON cs.clinic_id = c.clinic_id AND cs.role = 'sales_staff'
LIMIT 5;
