-- Follow-up & Loyalty System Migration
-- ปลอดภัยสำหรับฐานข้อมูลที่มี customers อยู่แล้ว

-- FOLLOW-UP RULES TABLE
CREATE TABLE IF NOT EXISTS followup_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'medium',
  active BOOLEAN DEFAULT true,
  ai_personalization BOOLEAN DEFAULT false,
  template JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_followup_type CHECK (type IN (
    'post_treatment', 'payment_reminder', 'appointment_reminder',
    'satisfaction_survey', 'upsell_opportunity', 'loyalty_reward',
    'birthday_special', 'inactive_reactivation'
  )),
  CONSTRAINT valid_followup_priority CHECK (priority IN ('low', 'medium', 'high'))
);

-- FOLLOW-UP EXECUTIONS TABLE
CREATE TABLE IF NOT EXISTS followup_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES followup_rules(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  personalized_content JSONB DEFAULT '{}',
  response JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_execution_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  CONSTRAINT valid_execution_channel CHECK (channel IN ('email', 'sms', 'line', 'call', 'in_app'))
);

-- CUSTOMER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  preferred_channels TEXT[] DEFAULT ARRAY['email', 'sms'],
  do_not_contact BOOLEAN DEFAULT false,
  marketing_opt_in BOOLEAN DEFAULT true,
  best_contact_time VARCHAR(50) DEFAULT 'anytime',
  timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
  language VARCHAR(10) DEFAULT 'th',
  content_style VARCHAR(20) DEFAULT 'friendly',
  max_weekly_contacts INTEGER DEFAULT 3,
  max_monthly_contacts INTEGER DEFAULT 10,
  birthday DATE,
  anniversary_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_contact_time CHECK (best_contact_time IN (
    'morning', 'afternoon', 'evening', 'anytime', 'business_hours'
  )),
  CONSTRAINT valid_content_style CHECK (content_style IN ('professional', 'friendly', 'casual')),
  CONSTRAINT valid_language CHECK (language IN ('th', 'en')),
  UNIQUE(customer_id, clinic_id)
);

-- FOLLOW-UP TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS followup_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  language VARCHAR(10) DEFAULT 'th',
  subject VARCHAR(255),
  message TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_system_template BOOLEAN DEFAULT false,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMER JOURNEY EVENTS TABLE
CREATE TABLE IF NOT EXISTS customer_journey_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  source VARCHAR(50) NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'treatment_completed', 'payment_made', 'appointment_booked',
    'email_opened', 'sms_replied', 'website_visited', 'review_submitted',
    'complaint_made', 'referral_made', 'loyalty_milestone'
  ))
);

-- LOYALTY PROFILES TABLE
CREATE TABLE IF NOT EXISTS loyalty_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  current_tier VARCHAR(20) DEFAULT 'bronze',
  tier_progress DECIMAL(5,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  average_spend DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  unlocked_achievements UUID[] DEFAULT '{}',
  total_achievements INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  referral_code VARCHAR(10) UNIQUE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_tier CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  UNIQUE(customer_id, clinic_id)
);

-- POINT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  workflow_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,
  achievement_id UUID,
  reward_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT valid_transaction_type CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus', 'refund'))
);

-- ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL,
  conditions JSONB NOT NULL,
  points_reward INTEGER DEFAULT 0,
  badge_icon VARCHAR(10),
  special_reward JSONB,
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_achievement_category CHECK (category IN (
    'spending', 'frequency', 'referral', 'engagement', 'milestone', 'special'
  ))
);

-- LOYALTY REWARDS TABLE
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  points_cost INTEGER NOT NULL,
  monetary_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  tier_requirement VARCHAR(20),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  auto_apply BOOLEAN DEFAULT false,
  stackable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_reward_type CHECK (type IN (
    'discount_percentage', 'discount_amount', 'free_service',
    'upgrade_service', 'birthday_special', 'referral_bonus'
  ))
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_followup_rules_clinic_active ON followup_rules(clinic_id, active);
CREATE INDEX IF NOT EXISTS idx_followup_executions_scheduled ON followup_executions(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_followup_executions_customer ON followup_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer ON customer_preferences(customer_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_customer ON customer_journey_events(customer_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_profiles_customer ON loyalty_profiles(customer_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_profiles_referral ON loyalty_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_point_transactions_customer ON point_transactions(customer_id, created_at DESC);

-- Row Level Security
ALTER TABLE followup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage followup rules in their clinic" ON followup_rules
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view followup executions in their clinic" ON followup_executions
  FOR SELECT USING (
    rule_id IN (
      SELECT id FROM followup_rules WHERE clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage customer preferences in their clinic" ON customer_preferences
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view templates for their clinic" ON followup_templates
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    OR is_system_template = true
  );

CREATE POLICY "Users can view journey events in their clinic" ON customer_journey_events
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view loyalty profiles in their clinic" ON loyalty_profiles
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage loyalty profiles in their clinic" ON loyalty_profiles
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

-- Insert Default Templates
INSERT INTO followup_templates (name, type, language, subject, message, variables, is_system_template, category) VALUES
('Post Treatment Follow-up (TH)', 'post_treatment', 'th', 'ขอบคุณที่ใช้บริการ', 
 'สวัสดีค่ะคุณ {customerName} ขอบคุณที่มาใช้บริการ Treatment {treatmentName} กับเรา หวังว่าคุณจะพอใจกับผลลัพธ์นะคะ', 
 ARRAY['customerName', 'treatmentName'], true, 'aftercare'),

('Payment Reminder (TH)', 'payment_reminder', 'th', 'แจ้งเตือนการชำระเงิน',
 'สวัสดีค่ะคุณ {customerName} เราขอแจ้งเตือนการชำระเงินค่าบริการ {serviceName} จำนวน {amount} บาท',
 ARRAY['customerName', 'serviceName', 'amount'], true, 'billing'),

('Birthday Special (TH)', 'birthday_special', 'th', 'สุขสันต์วันเกิด! 🎉',
 'สุขสันต์วันเกิดค่ะคุณ {customerName}! 🎂 ในโอกาสวันพิเศษนี้ เรามีโปรโมชั่นพิเศษให้คุณ',
 ARRAY['customerName'], true, 'promotion')
ON CONFLICT DO NOTHING;
