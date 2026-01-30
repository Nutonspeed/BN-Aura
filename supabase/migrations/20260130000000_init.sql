-- BN-Aura: Initial Database Schema
-- Standard initialization for a Multi-tenant Aesthetic Clinic Platform

-- 1. Custom Types (ENUMs)
CREATE TYPE clinic_role AS ENUM ('clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff');
CREATE TYPE user_role AS ENUM ('public', 'free_user', 'premium_customer', 'super_admin');
CREATE TYPE analysis_tier AS ENUM ('free', 'premium', 'clinical');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'cold', 'warm', 'hot');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
CREATE TYPE lead_source AS ENUM ('website', 'walk_in', 'referral', 'social_media', 'ads');
CREATE TYPE video_call_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- 2. Core Tables
-- Clinics (Multi-tenancy root)
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_code VARCHAR(20) UNIQUE NOT NULL,
  display_name JSONB NOT NULL, -- { "th": "...", "en": "..." }
  subscription_tier TEXT DEFAULT 'starter',
  max_sales_staff INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Profile Extension)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'free_user',
  tier analysis_tier NOT NULL DEFAULT 'free',
  clinic_id UUID REFERENCES public.clinics(id),
  full_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinic Staff (Mapping Users to Clinics with specific roles)
CREATE TABLE public.clinic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role clinic_role NOT NULL DEFAULT 'clinic_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, user_id)
);

-- Branches
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_code VARCHAR(50) UNIQUE NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skin Analysis (AI Results)
CREATE TABLE public.skin_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  clinic_id UUID REFERENCES public.clinics(id),
  image_url TEXT NOT NULL,
  overall_score NUMERIC(5, 2),
  skin_health_grade VARCHAR(2),
  spots_score NUMERIC(5, 2),
  wrinkles_score NUMERIC(5, 2),
  texture_score NUMERIC(5, 2),
  pores_score NUMERIC(5, 2),
  spots_detections JSONB,
  recommendations JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatments
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  names JSONB NOT NULL, -- { "th": "...", "en": "..." }
  category VARCHAR(50) NOT NULL, -- injectable, laser, skincare
  price_min NUMERIC(10, 2) NOT NULL,
  price_max NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Metrics (Quota tracking)
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL, -- ai_scans, sms_sent
  current_usage INTEGER DEFAULT 0,
  quota_limit INTEGER NOT NULL,
  reset_period VARCHAR(20) DEFAULT 'monthly',
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory & Stock
CREATE TABLE public.inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku VARCHAR(50),
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  cost_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  current_stock INTEGER DEFAULT 0,
  UNIQUE(branch_id, product_id)
);

CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_inventory_id UUID REFERENCES public.branch_inventory(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES auth.users(id),
  change_amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Functions & Triggers
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'free_user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS Configuration (Basics)
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- Note: Policies will be added in the next step using JWT Claims optimization.
