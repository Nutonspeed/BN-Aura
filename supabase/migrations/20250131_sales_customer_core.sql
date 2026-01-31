-- Sales-Customer Core System Migration
-- Essential tables for sales-customer relationship

-- 1. Customer-Sales Assignment
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS assigned_sales_id UUID REFERENCES clinic_staff(id),
ADD COLUMN IF NOT EXISTS assignment_date TIMESTAMPTZ DEFAULT NOW();

-- 2. Multi-Clinic Pricing
CREATE TABLE clinic_treatment_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  treatment_name VARCHAR(200) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  sales_commission_rate DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Commission Tracking
CREATE TABLE sales_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_staff_id UUID NOT NULL REFERENCES clinic_staff(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  transaction_type VARCHAR(50) NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer-Sales Chat
CREATE TABLE customer_sales_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_staff_id UUID NOT NULL REFERENCES clinic_staff(id),
  sender_type VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE clinic_treatment_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sales_messages ENABLE ROW LEVEL SECURITY;
