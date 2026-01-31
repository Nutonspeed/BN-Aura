-- BN-Aura: Create Missing Core Tables
-- Customers and Appointments tables for complete CRM functionality

-- 1. Customers Table
-- Central customer management for each clinic
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: if customer has login
  assigned_sales_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer Information
  customer_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "CUST-2025-001"
  full_name TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- Address
  address JSONB DEFAULT '{}'::jsonb, -- { "th": "...", "en": "..." }
  district TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Customer Status & Classification
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'member')),
  source TEXT DEFAULT 'walk_in' CHECK (source IN ('walk_in', 'referral', 'social_media', 'website', 'ads')),
  
  -- Medical Information (Optional)
  allergies TEXT,
  medical_notes TEXT,
  skin_concerns JSONB DEFAULT '[]'::jsonb, -- Array of concerns
  
  -- Metadata
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  first_visit_date DATE,
  last_visit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(clinic_id, customer_code)
);

-- 2. Appointments Table
-- Complete appointment scheduling system
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Appointment Details
  appointment_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "APT-2025-001"
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'treatment', 'follow_up', 'scan')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Date & Time
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  
  -- Services & Treatments
  treatment_ids JSONB DEFAULT '[]'::jsonb, -- Array of treatment IDs
  services JSONB DEFAULT '[]'::jsonb, -- { "name": "...", "duration": ..., "price": ... }
  total_price DECIMAL(10,2) DEFAULT 0,
  
  -- Notes & Communications
  notes TEXT,
  customer_notes TEXT,
  staff_notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_method JSONB DEFAULT '[]'::jsonb, -- ["sms", "email", "line"]
  
  -- Location
  room_id TEXT,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(clinic_id, appointment_code),
  CHECK (end_time > start_time)
);

-- 3. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_customers_clinic_id ON public.customers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_sales_id ON public.customers(assigned_sales_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at DESC);

-- 4. Create RLS Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Customers RLS Policies
CREATE POLICY "Super admin full access to customers" ON public.customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Clinic staff access to own clinic customers" ON public.customers
  FOR ALL USING (
    clinic_id = (auth.jwt() ->> 'clinic_id')::uuid
  );

CREATE POLICY "Sales staff access to assigned customers" ON public.customers
  FOR ALL USING (
    clinic_id = (auth.jwt() ->> 'clinic_id')::uuid AND
    (assigned_sales_id = auth.uid() OR auth.jwt() ->> 'role' IN ('clinic_owner', 'clinic_admin'))
  );

-- Appointments RLS Policies
CREATE POLICY "Super admin full access to appointments" ON public.appointments
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Clinic staff access to own clinic appointments" ON public.appointments
  FOR ALL USING (
    clinic_id = (auth.jwt() ->> 'clinic_id')::uuid
  );

CREATE POLICY "Sales staff access to own appointments" ON public.appointments
  FOR ALL USING (
    clinic_id = (auth.jwt() ->> 'clinic_id')::uuid AND
    (staff_id = auth.uid() OR auth.jwt() ->> 'role' IN ('clinic_owner', 'clinic_admin'))
  );

-- 5. Create Triggers for Updated At
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Create Helper Functions
-- Function to generate customer code
CREATE OR REPLACE FUNCTION public.generate_customer_code(p_clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  v_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 12) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.customers
  WHERE clinic_id = p_clinic_id
  AND customer_code LIKE 'CUST-' || v_year || '-%';
  
  RETURN 'CUST-' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate appointment code
CREATE OR REPLACE FUNCTION public.generate_appointment_code(p_clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  v_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_code FROM 12) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.appointments
  WHERE clinic_id = p_clinic_id
  AND appointment_code LIKE 'APT-' || v_year || '-%';
  
  RETURN 'APT-' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
