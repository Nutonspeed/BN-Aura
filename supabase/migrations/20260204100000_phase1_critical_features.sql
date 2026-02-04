-- Phase 1 Critical Features Migration
-- Online Booking, Gift Cards, Memberships, Before/After Gallery, Consent Forms

-- ============================================================
-- 1. ONLINE BOOKING SYSTEM
-- ============================================================

-- Booking Settings per Clinic
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Widget Settings
  widget_enabled BOOLEAN DEFAULT true,
  widget_theme JSONB DEFAULT '{"primaryColor": "#6366f1", "borderRadius": "8px"}',
  
  -- Booking Rules
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 30,
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_between_slots INTEGER DEFAULT 0,
  
  -- Working Hours (per day of week)
  working_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "enabled": true},
    "tuesday": {"open": "09:00", "close": "18:00", "enabled": true},
    "wednesday": {"open": "09:00", "close": "18:00", "enabled": true},
    "thursday": {"open": "09:00", "close": "18:00", "enabled": true},
    "friday": {"open": "09:00", "close": "18:00", "enabled": true},
    "saturday": {"open": "10:00", "close": "16:00", "enabled": true},
    "sunday": {"open": null, "close": null, "enabled": false}
  }',
  
  -- Notifications
  send_confirmation_email BOOLEAN DEFAULT true,
  send_reminder_sms BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  
  -- Deposit Settings
  require_deposit BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Cancellation Policy
  cancellation_hours INTEGER DEFAULT 24,
  cancellation_fee_percentage DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(clinic_id)
);

-- Bookable Services (treatments available for online booking)
CREATE TABLE IF NOT EXISTS bookable_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  
  name JSONB NOT NULL, -- {"th": "...", "en": "..."}
  description JSONB, -- {"th": "...", "en": "..."}
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  deposit_required DECIMAL(10,2) DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  online_booking_enabled BOOLEAN DEFAULT true,
  max_bookings_per_day INTEGER,
  
  -- Staff Assignment
  available_staff_ids UUID[] DEFAULT '{}',
  requires_specific_staff BOOLEAN DEFAULT false,
  
  -- Category
  category VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  
  -- Image
  image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Availability Overrides (holidays, blocked times)
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Override Type
  type VARCHAR(20) NOT NULL, -- 'available', 'unavailable', 'break'
  
  -- Time Range
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_availability_type CHECK (type IN ('available', 'unavailable', 'break'))
);

-- Public Booking Tokens (for widget authentication)
CREATE TABLE IF NOT EXISTS booking_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  
  -- Restrictions
  allowed_domains TEXT[],
  rate_limit_per_hour INTEGER DEFAULT 100,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- 2. GIFT CARDS & VOUCHERS
-- ============================================================

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Card Details
  code VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL DEFAULT 'value', -- 'value', 'service', 'percentage'
  
  -- Value
  initial_value DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  
  -- For service-type cards
  service_id UUID REFERENCES bookable_services(id) ON DELETE SET NULL,
  service_quantity INTEGER DEFAULT 1,
  
  -- For percentage-type cards
  discount_percentage DECIMAL(5,2),
  max_discount_amount DECIMAL(10,2),
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Purchase Info
  purchased_by_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  purchase_amount DECIMAL(10,2),
  
  -- Recipient
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  personal_message TEXT,
  
  -- Delivery
  delivery_method VARCHAR(20) DEFAULT 'email', -- 'email', 'sms', 'print', 'physical'
  delivered_at TIMESTAMPTZ,
  
  -- Design
  template_id VARCHAR(50) DEFAULT 'default',
  custom_design JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_gift_card_type CHECK (type IN ('value', 'service', 'percentage'))
);

-- Gift Card Transactions
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  
  -- Transaction
  type VARCHAR(20) NOT NULL, -- 'purchase', 'redemption', 'refund', 'adjustment', 'expiry'
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  -- Reference
  order_id UUID,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_gc_transaction_type CHECK (type IN ('purchase', 'redemption', 'refund', 'adjustment', 'expiry'))
);

-- Gift Card Templates
CREATE TABLE IF NOT EXISTS gift_card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  design JSONB NOT NULL, -- colors, images, layout
  preview_image_url TEXT,
  
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. MEMBERSHIPS & PACKAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Basic Info
  name JSONB NOT NULL, -- {"th": "...", "en": "..."}
  description JSONB,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly', 'one_time'
  
  -- Benefits
  included_services JSONB DEFAULT '[]', -- [{service_id, quantity, discount_percentage}]
  discount_all_services DECIMAL(5,2) DEFAULT 0,
  priority_booking BOOLEAN DEFAULT false,
  free_consultations INTEGER DEFAULT 0,
  
  -- Points/Rewards
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  welcome_points INTEGER DEFAULT 0,
  
  -- Validity
  validity_days INTEGER, -- null = unlimited
  is_active BOOLEAN DEFAULT true,
  
  -- Limits
  max_active_members INTEGER, -- null = unlimited
  
  -- Display
  badge_color VARCHAR(20) DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('monthly', 'quarterly', 'yearly', 'one_time'))
);

-- Customer Memberships
CREATE TABLE IF NOT EXISTS customer_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'expired'
  
  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_billing_date DATE,
  
  -- Usage Tracking
  services_used JSONB DEFAULT '{}', -- {service_id: count}
  consultations_used INTEGER DEFAULT 0,
  
  -- Payment
  payment_method VARCHAR(50),
  auto_renew BOOLEAN DEFAULT true,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_membership_status CHECK (status IN ('active', 'paused', 'cancelled', 'expired'))
);

-- Packages (Pre-paid Service Bundles)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Basic Info
  name JSONB NOT NULL, -- {"th": "...", "en": "..."}
  description JSONB,
  
  -- Pricing
  regular_price DECIMAL(10,2) NOT NULL,
  package_price DECIMAL(10,2) NOT NULL,
  
  -- Contents
  services JSONB NOT NULL, -- [{service_id, quantity, name}]
  total_sessions INTEGER NOT NULL,
  
  -- Validity
  validity_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  
  -- Display
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Packages (Purchased)
CREATE TABLE IF NOT EXISTS customer_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Usage
  sessions_remaining INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  services_used JSONB DEFAULT '{}', -- {service_id: count}
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  
  -- Dates
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Payment
  amount_paid DECIMAL(10,2) NOT NULL,
  order_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_package_status CHECK (status IN ('active', 'exhausted', 'expired', 'refunded'))
);

-- Package Usage Log
CREATE TABLE IF NOT EXISTS package_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_package_id UUID NOT NULL REFERENCES customer_packages(id) ON DELETE CASCADE,
  
  service_id UUID REFERENCES bookable_services(id),
  appointment_id UUID REFERENCES appointments(id),
  
  sessions_deducted INTEGER DEFAULT 1,
  staff_id UUID REFERENCES auth.users(id),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. BEFORE/AFTER GALLERY
-- ============================================================

CREATE TABLE IF NOT EXISTS treatment_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Treatment Reference
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Photo Type
  type VARCHAR(20) NOT NULL, -- 'before', 'after', 'progress'
  sequence_number INTEGER DEFAULT 1, -- for progress photos
  
  -- Photo Details
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Metadata
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  taken_by_staff_id UUID REFERENCES auth.users(id),
  
  -- Analysis (if AI analyzed)
  ai_analysis JSONB,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Privacy
  customer_consent BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  public_gallery_consent BOOLEAN DEFAULT false,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_photo_type CHECK (type IN ('before', 'after', 'progress'))
);

-- Photo Pairs (linking before/after)
CREATE TABLE IF NOT EXISTS photo_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  before_photo_id UUID NOT NULL REFERENCES treatment_photos(id) ON DELETE CASCADE,
  after_photo_id UUID NOT NULL REFERENCES treatment_photos(id) ON DELETE CASCADE,
  
  -- Treatment Info
  treatment_id UUID REFERENCES treatments(id),
  treatment_name VARCHAR(255),
  
  -- Display
  title VARCHAR(255),
  description TEXT,
  
  -- Public Gallery
  is_public BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. DIGITAL CONSENT FORMS
-- ============================================================

CREATE TABLE IF NOT EXISTS consent_form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Form Details
  name JSONB NOT NULL, -- {"th": "...", "en": "..."}
  description JSONB,
  
  -- Content
  content JSONB NOT NULL, -- Rich text content with placeholders
  fields JSONB DEFAULT '[]', -- Custom fields to collect
  
  -- Requirements
  requires_signature BOOLEAN DEFAULT true,
  requires_witness BOOLEAN DEFAULT false,
  requires_photo_id BOOLEAN DEFAULT false,
  
  -- Associations
  treatment_ids UUID[] DEFAULT '{}',
  required_for_all_treatments BOOLEAN DEFAULT false,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES consent_form_templates(id) ON DELETE CASCADE,
  
  -- Appointment/Treatment
  appointment_id UUID REFERENCES appointments(id),
  treatment_id UUID REFERENCES treatments(id),
  
  -- Form Data
  form_version INTEGER NOT NULL,
  field_values JSONB DEFAULT '{}',
  
  -- Signature
  signature_url TEXT,
  signature_data TEXT, -- Base64 encoded
  signed_at TIMESTAMPTZ,
  
  -- Witness (if required)
  witness_name VARCHAR(255),
  witness_signature_url TEXT,
  witness_signed_at TIMESTAMPTZ,
  
  -- Photo ID (if required)
  photo_id_url TEXT,
  
  -- PDF
  pdf_url TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- IP/Device Info
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_consent_status CHECK (status IN ('pending', 'signed', 'expired', 'revoked'))
);

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_booking_settings_clinic ON booking_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bookable_services_clinic ON bookable_services(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staff_availability_clinic_staff ON staff_availability(clinic_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_datetime ON staff_availability(start_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_gift_cards_clinic ON gift_cards(clinic_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id);

CREATE INDEX IF NOT EXISTS idx_memberships_clinic ON memberships(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customer_memberships_customer ON customer_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_clinic ON customer_memberships(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_clinic ON service_packages(clinic_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer ON customer_packages(customer_id);

CREATE INDEX IF NOT EXISTS idx_treatment_photos_customer ON treatment_photos(customer_id);
CREATE INDEX IF NOT EXISTS idx_treatment_photos_clinic ON treatment_photos(clinic_id);
CREATE INDEX IF NOT EXISTS idx_photo_comparisons_public ON photo_comparisons(clinic_id) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_consent_templates_clinic ON consent_form_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_customer_consents_customer ON customer_consents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_consents_appointment ON customer_consents(appointment_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookable_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_consents ENABLE ROW LEVEL SECURITY;

-- Booking Settings Policies
CREATE POLICY "Clinic staff can manage booking settings" ON booking_settings
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_admin')
    )
  );

CREATE POLICY "Public can view enabled booking settings" ON booking_settings
  FOR SELECT USING (widget_enabled = true);

-- Bookable Services Policies
CREATE POLICY "Clinic staff can manage bookable services" ON bookable_services
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_admin')
    )
  );

CREATE POLICY "Public can view active bookable services" ON bookable_services
  FOR SELECT USING (is_active = true AND online_booking_enabled = true);

-- Gift Cards Policies
CREATE POLICY "Clinic staff can manage gift cards" ON gift_cards
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their gift cards" ON gift_cards
  FOR SELECT USING (
    purchased_by_customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Memberships Policies
CREATE POLICY "Clinic staff can manage memberships" ON memberships
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_admin')
    )
  );

CREATE POLICY "Public can view active memberships" ON memberships
  FOR SELECT USING (is_active = true);

-- Customer Memberships Policies
CREATE POLICY "Clinic staff can manage customer memberships" ON customer_memberships
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their memberships" ON customer_memberships
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Treatment Photos Policies
CREATE POLICY "Clinic staff can manage treatment photos" ON treatment_photos
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their photos" ON treatment_photos
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Photo Comparisons Policies
CREATE POLICY "Public can view public comparisons" ON photo_comparisons
  FOR SELECT USING (is_public = true);

CREATE POLICY "Clinic staff can manage comparisons" ON photo_comparisons
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
    )
  );

-- Consent Forms Policies
CREATE POLICY "Clinic staff can manage consent templates" ON consent_form_templates
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff 
      WHERE user_id = auth.uid() AND role IN ('clinic_owner', 'clinic_admin')
    )
  );

CREATE POLICY "Customers can view consent templates" ON consent_form_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Clinic staff can manage customer consents" ON customer_consents
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view/sign their consents" ON customer_consents
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Super Admin policies
CREATE POLICY "Super admin full access booking_settings" ON booking_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin full access gift_cards" ON gift_cards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin full access memberships" ON memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin full access treatment_photos" ON treatment_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin full access customer_consents" ON customer_consents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );
