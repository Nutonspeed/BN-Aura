# 🏗️ BN-Aura: SQL Schema Definition (Database Blueprint)

เอกสารชุดนี้สรุปโครงสร้างฐานข้อมูล PostgreSQL บน Supabase ทั้งหมด เพื่อให้ AI สามารถสร้าง Database ของ BN-Aura ขึ้นใหม่ได้ตรงตามมาตรฐานเดิม 100%

## 1. Custom Types (ENUMs)

ระบบใช้ ENUMs เพื่อควบคุมความถูกต้องของสถานะข้อมูล:

```sql
-- บทบาทผู้ใช้ภายในคลินิก (Clinic-specific Roles)
CREATE TYPE clinic_role AS ENUM (
  'clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff'
);

-- บทบาทผู้ใช้ระดับระบบ (Global Roles)
CREATE TYPE user_role AS ENUM (
  'public', 'free_user', 'premium_customer', 'super_admin'
);

-- ระดับการวิเคราะห์
CREATE TYPE analysis_tier AS ENUM ('free', 'premium', 'clinical');

-- สถานะ Lead
CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'proposal_sent', 
  'negotiation', 'won', 'lost', 'cold', 'warm', 'hot'
);

-- สถานะ Proposal
CREATE TYPE proposal_status AS ENUM (
  'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'
);
```

## 2. Core Tables (DDL)

### 🏥 Clinics & Multi-tenancy
```sql
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_code VARCHAR(20) UNIQUE NOT NULL,
  display_name JSONB NOT NULL, -- { "th": "...", "en": "..." }
  subscription_tier TEXT DEFAULT 'standard',
  max_sales_staff INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ตารางพนักงานประจำคลินิก (รองรับพนักงานคนเดียวอยู่หลายคลินิก)
CREATE TABLE public.clinic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role clinic_role NOT NULL DEFAULT 'clinic_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, user_id)
);
```

### 👤 Users (Profile Extension)
```sql
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
```

### 🧪 Skin Analysis (AI Results)
```sql
CREATE TABLE public.skin_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  clinic_id UUID REFERENCES public.clinics(id),
  image_url TEXT NOT NULL,
  overall_score NUMERIC(5, 2),
  skin_health_grade VARCHAR(2), -- A+, B, etc.
  
  -- Scores (0-100)
  spots_score NUMERIC(5, 2),
  wrinkles_score NUMERIC(5, 2),
  texture_score NUMERIC(5, 2),
  pores_score NUMERIC(5, 2),
  
  -- AI Data
  spots_detections JSONB,
  recommendations JSONB,
  
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 💰 Sales CRM & Proposals
```sql
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  sales_user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status lead_status DEFAULT 'new',
  score INTEGER DEFAULT 0,
  source lead_source DEFAULT 'website',
  primary_concern TEXT,
  estimated_value DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sales_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES public.users(id),
  clinic_id UUID REFERENCES public.clinics(id),
  title TEXT NOT NULL,
  treatments JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, price, sessions}
  total_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status proposal_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📅 Branches & Appointments
```sql
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

CREATE TABLE public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  doctor_id UUID REFERENCES public.users(id),
  room_id UUID,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  service_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 💉 Treatments & Recommendations
```sql
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  names JSONB NOT NULL, -- { "th": "...", "en": "..." }
  category VARCHAR(50) NOT NULL, -- injectable, laser, skincare
  price_min NUMERIC(10, 2) NOT NULL,
  price_max NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.treatment_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.skin_analyses(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,
  confidence_score NUMERIC(3, 2),
  recommendation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📧 Onboarding & Invitations
```sql
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_role TEXT NOT NULL, -- clinic_owner, sales_staff, customer
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 💬 Communication & Progress
```sql
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.analysis_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  before_analysis_id UUID NOT NULL REFERENCES public.skin_analyses(id),
  after_analysis_id UUID NOT NULL REFERENCES public.skin_analyses(id),
  overall_improvement NUMERIC(6, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### � Video Consultation (WebRTC)
```sql
CREATE TABLE public.video_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status video_call_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.video_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'participant',
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### �📦 Inventory & Stock
```sql
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

-- ระบบติดตามการใช้งาน (Quota & Usage Tracking)
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL, -- ai_scans, sms_sent, etc.
  current_usage INTEGER DEFAULT 0,
  quota_limit INTEGER NOT NULL,
  reset_period VARCHAR(20) DEFAULT 'monthly',
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ประวัติการเคลื่อนไหวของสต็อก (Stock Movement Audit)
CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_inventory_id UUID REFERENCES public.branch_inventory(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES auth.users(id),
  change_amount INTEGER NOT NULL,
  reason TEXT, -- sale, restock, correction
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 💎 Loyalty & Rewards
```sql
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  points INTEGER NOT NULL,
  transaction_type TEXT, -- earn, redeem
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📊 System Logs & Analytics
```sql
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Critical Functions & Triggers

### Auto-Profile Creation
เมื่อมีการสมัครสมาชิกผ่าน Supabase Auth ให้สร้างแถวใน `public.users` ทันที:
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'free_user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### AI Scoring Logic
คำนวณคะแนนรวมผิวหน้าแบบถ่วงน้ำหนัก:
```sql
CREATE FUNCTION calculate_overall_skin_score(
  p_texture NUMERIC, p_spots NUMERIC, p_wrinkles NUMERIC, p_pores NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND((p_texture * 0.4 + p_spots * 0.2 + p_wrinkles * 0.2 + p_pores * 0.2), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## 4. RLS Policy Patterns

ความปลอดภัยของข้อมูลแยกตามคลินิก (Multi-tenant):

```sql
-- สำหรับเจ้าของคลินิกและพนักงาน
CREATE POLICY "Clinic Data Access" ON public.some_table
FOR ALL USING (
  clinic_id = (SELECT clinic_id FROM public.users WHERE id = auth.uid())
);

-- สำหรับลูกค้า (ดูข้อมูลตัวเองเท่านั้น)
CREATE POLICY "Customer Data Access" ON public.skin_analyses
FOR SELECT USING (
  auth.uid() = user_id
);
```

## 5. Performance Indexes
- `idx_users_clinic`: สำหรับการ Join ข้อมูลตามคลินิก
- `idx_leads_status_score`: สำหรับหน้า Sales Dashboard
- `idx_analyses_user_date`: สำหรับประวัติการสแกนผิว
