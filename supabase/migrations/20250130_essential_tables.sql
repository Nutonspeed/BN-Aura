-- Essential Missing Tables for BN-Aura System

-- CLINIC QUOTAS TABLE
CREATE TABLE IF NOT EXISTS clinic_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'basic',
  monthly_quota INTEGER NOT NULL DEFAULT 50,
  current_usage INTEGER NOT NULL DEFAULT 0,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  overage_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,
  overage DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reset_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + interval '1 month'),
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scan_type VARCHAR(50) NOT NULL DEFAULT 'detailed',
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  successful BOOLEAN NOT NULL DEFAULT false,
  customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAFF INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by UUID NOT NULL,
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAD SCORING DATA TABLE
CREATE TABLE IF NOT EXISTS lead_scoring_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  overall_score INTEGER NOT NULL,
  lead_category VARCHAR(20) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALES PROPOSALS TABLE
CREATE TABLE IF NOT EXISTS sales_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  proposal_html TEXT NOT NULL,
  treatments JSONB NOT NULL DEFAULT '[]',
  pricing JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_usage_clinic_date ON ai_usage_logs(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_score ON lead_scoring_data(clinic_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_clinic_status ON sales_proposals(clinic_id, status);
