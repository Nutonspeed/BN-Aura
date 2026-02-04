-- Phase 2 High Priority Features Migration
-- Waitlist, Follow-up Sequences, Analytics, Commission, Multi-branch

-- ============================================================
-- 1. WAITLIST MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  -- For new customers not yet in system
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  service_id UUID REFERENCES bookable_services(id) ON DELETE SET NULL,
  preferred_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  preferred_dates DATE[] DEFAULT '{}',
  preferred_time_range JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
  flexible_dates BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- 1-10, 1 = highest
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  notes TEXT,
  notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "line": false}',
  notified_count INTEGER DEFAULT 0,
  last_notified_at TIMESTAMPTZ,
  converted_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_waitlist_status CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS waitlist_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waitlist_entry_id UUID NOT NULL REFERENCES waitlist_entries(id) ON DELETE CASCADE,
  available_slot JSONB NOT NULL, -- {date, time, staff_id, duration}
  channel VARCHAR(20) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  response VARCHAR(20),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  CONSTRAINT valid_notification_channel CHECK (channel IN ('sms', 'email', 'line', 'push')),
  CONSTRAINT valid_notification_response CHECK (response IN ('accepted', 'declined', 'expired', NULL))
);

-- ============================================================
-- 2. AUTOMATED FOLLOW-UP SEQUENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS followup_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
    'after_appointment', 'after_purchase', 'membership_expiring',
    'package_expiring', 'birthday', 'inactive_customer', 'new_customer',
    'treatment_milestone', 'review_request', 'custom'
  ))
);

CREATE TABLE IF NOT EXISTS followup_sequence_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  channel VARCHAR(20) NOT NULL,
  template_id UUID REFERENCES followup_templates(id) ON DELETE SET NULL,
  custom_content JSONB,
  conditions JSONB DEFAULT '{}', -- Additional conditions to check before sending
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_step_channel CHECK (channel IN ('sms', 'email', 'line', 'push', 'task'))
);

CREATE TABLE IF NOT EXISTS customer_sequence_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
  trigger_event_id UUID, -- Reference to the event that triggered this
  trigger_data JSONB DEFAULT '{}',
  current_step INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_enrollment_status CHECK (status IN ('active', 'paused', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS sequence_step_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES customer_sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES followup_sequence_steps(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_execution_status CHECK (status IN ('pending', 'sent', 'failed', 'skipped', 'cancelled'))
);

-- ============================================================
-- 3. REVENUE ANALYTICS ENHANCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(20) NOT NULL DEFAULT 'daily',
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2) DEFAULT 0,
  service_revenue DECIMAL(12,2) DEFAULT 0,
  product_revenue DECIMAL(12,2) DEFAULT 0,
  package_revenue DECIMAL(12,2) DEFAULT 0,
  membership_revenue DECIMAL(12,2) DEFAULT 0,
  gift_card_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Transaction counts
  total_transactions INTEGER DEFAULT 0,
  service_transactions INTEGER DEFAULT 0,
  product_transactions INTEGER DEFAULT 0,
  
  -- Customer metrics
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  
  -- Appointment metrics
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  no_show_appointments INTEGER DEFAULT 0,
  
  -- Average metrics
  average_transaction_value DECIMAL(10,2) DEFAULT 0,
  average_service_duration INTEGER DEFAULT 0,
  
  -- Staff metrics
  staff_utilization_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Comparison to previous period
  revenue_change_percent DECIMAL(5,2),
  customer_change_percent DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, branch_id, snapshot_date, snapshot_type),
  CONSTRAINT valid_snapshot_type CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'yearly'))
);

CREATE TABLE IF NOT EXISTS service_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES bookable_services(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  bookings_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  cancelled_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2),
  repeat_customer_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, service_id, period_start, period_end)
);

-- ============================================================
-- 4. COMMISSION TRACKING ENHANCEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(30) NOT NULL,
  
  -- Conditions
  applies_to_roles TEXT[] DEFAULT '{}',
  applies_to_staff_ids UUID[] DEFAULT '{}',
  applies_to_service_ids UUID[] DEFAULT '{}',
  applies_to_product_ids UUID[] DEFAULT '{}',
  min_transaction_amount DECIMAL(10,2),
  
  -- Commission calculation
  calculation_type VARCHAR(20) NOT NULL,
  percentage DECIMAL(5,2),
  fixed_amount DECIMAL(10,2),
  tiered_rates JSONB, -- [{min: 0, max: 10000, rate: 5}, {min: 10001, rate: 7}]
  
  -- Validity
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('service', 'product', 'package', 'membership', 'new_customer', 'upsell')),
  CONSTRAINT valid_calculation_type CHECK (calculation_type IN ('percentage', 'fixed', 'tiered'))
);

CREATE TABLE IF NOT EXISTS commission_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  
  transaction_type VARCHAR(30) NOT NULL,
  transaction_id UUID NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  
  commission_amount DECIMAL(10,2) NOT NULL,
  calculation_details JSONB,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_commission_status CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'disputed'))
);

CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  total_amount DECIMAL(12,2) NOT NULL,
  deductions DECIMAL(10,2) DEFAULT 0,
  adjustments DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  
  commission_record_ids UUID[] DEFAULT '{}',
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'approved', 'paid', 'cancelled'))
);

-- ============================================================
-- 5. MULTI-BRANCH MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS branch_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Operating hours (override clinic defaults)
  working_hours JSONB,
  holidays DATE[] DEFAULT '{}',
  
  -- Booking settings
  booking_buffer_minutes INTEGER,
  max_advance_booking_days INTEGER,
  min_advance_booking_hours INTEGER,
  
  -- Notification settings
  notification_emails TEXT[] DEFAULT '{}',
  notification_phones TEXT[] DEFAULT '{}',
  
  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_visible_on_booking BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id)
);

CREATE TABLE IF NOT EXISTS staff_branch_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  assignment_type VARCHAR(20) NOT NULL DEFAULT 'permanent',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Sunday, 6=Saturday
  is_primary_branch BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, branch_id),
  CONSTRAINT valid_assignment_type CHECK (assignment_type IN ('permanent', 'temporary', 'rotating'))
);

CREATE TABLE IF NOT EXISTS branch_inventory_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  from_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  to_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  
  notes TEXT,
  CONSTRAINT valid_transfer_status CHECK (status IN ('pending', 'approved', 'shipped', 'received', 'cancelled'))
);

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_waitlist_clinic_status ON waitlist_entries(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_customer ON waitlist_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_followup_sequences_clinic ON followup_sequences(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_customer ON customer_sequence_enrollments(customer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_clinic_date ON revenue_snapshots(clinic_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_commission_records_staff ON commission_records(staff_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_staff ON commission_payouts(staff_id, period_start);
CREATE INDEX IF NOT EXISTS idx_staff_branch_assignments ON staff_branch_assignments(staff_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_branch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_inventory_transfers ENABLE ROW LEVEL SECURITY;
