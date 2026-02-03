-- System Monitoring Tables
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  active_connections INTEGER,
  response_time_ms INTEGER,
  error_rate DECIMAL(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support System Tables
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('technical', 'billing', 'feature_request', 'general')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_internal BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements & Broadcasts
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical', 'maintenance')),
  target_audience VARCHAR(30) DEFAULT 'all' CHECK (target_audience IN ('all', 'clinics', 'staff', 'customers')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE(announcement_id, clinic_id)
);

-- Billing & Subscriptions
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'THB',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission System Enhancement
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_clinic_id ON support_tickets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_records_clinic_id ON billing_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON billing_records(status);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Enable RLS on all new tables
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Super Admin Policies (Full Access)
CREATE POLICY IF NOT EXISTS "Super admin full access on system_metrics"
  ON system_metrics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

CREATE POLICY IF NOT EXISTS "Super admin full access on system_alerts"
  ON system_alerts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

CREATE POLICY IF NOT EXISTS "Super admin full access on support_tickets"
  ON support_tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

CREATE POLICY IF NOT EXISTS "Super admin full access on announcements"
  ON announcements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

CREATE POLICY IF NOT EXISTS "Super admin full access on billing_records"
  ON billing_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

CREATE POLICY IF NOT EXISTS "Super admin full access on role_permissions"
  ON role_permissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
  ));

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action, conditions) VALUES
('super_admin', 'clinics', 'manage', '{}'),
('super_admin', 'users', 'manage', '{}'),
('super_admin', 'billing', 'manage', '{}'),
('super_admin', 'system', 'manage', '{}'),
('super_admin', 'security', 'manage', '{}'),
('super_admin', 'support', 'manage', '{}'),
('super_admin', 'announcements', 'manage', '{}'),
('clinic_owner', 'clinics', 'read', '{"clinic_id": "own"}'),
('clinic_owner', 'users', 'read', '{"clinic_id": "own"}'),
('clinic_owner', 'billing', 'read', '{"clinic_id": "own"}'),
('premium_customer', 'users', 'read', '{"user_id": "own"}'),
('free_user', 'users', 'read', '{"user_id": "own"}')
ON CONFLICT (role, resource, action) DO NOTHING;
