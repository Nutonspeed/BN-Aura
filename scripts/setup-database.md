# 🚀 Quick Database Setup Script

## สำหรับคัดลอกไปรันใน Supabase SQL Editor

### Step 1: สร้าง Custom Types

```sql
-- สร้าง enum types ทั้งหมด
CREATE TYPE public.clinic_role AS ENUM (
  'super_admin',
  'clinic_owner',
  'clinic_admin', 
  'clinic_staff',
  'doctor',
  'customer'
);

-- เพิ่ม types อื่นๆ ตามที่ใช้ใน schema ของคุณ
```

### Step 2: Import Schema จาก SQL File

1. **Copy SQL schema ทั้งหมดที่คุณมี**
2. **แยก tables ออกเป็นกลุ่มตาม dependencies**
3. **รันทีละกลุ่ม**

### Step 3: Enable RLS

```sql
-- Enable RLS สำหรับทุก table (แทนที่ด้วย table names จริง)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
```

### Step 4: สร้าง Basic RLS Policies

```sql
-- Policy สำหรับ super_admin (เข้าถึงได้ทุกอย่าง)
CREATE POLICY "Super admins have full access"
  ON public.clinics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ทำซ้ำสำหรับทุก table
```

### Step 5: สร้าง Indexes สำคัญ

```sql
-- Indexes สำหรับ performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_clinic_date 
  ON public.appointments(clinic_id, appointment_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_clinic_id 
  ON public.customers(clinic_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skin_analyses_customer_id 
  ON public.skin_analyses(customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_clinic_status 
  ON public.invoices(clinic_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinic_staff_user_id 
  ON public.clinic_staff(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinic_staff_clinic_id 
  ON public.clinic_staff(clinic_id);
```

### Step 6: สร้าง Helper Functions

```sql
-- Function: Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's clinic ID
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(user_id uuid)
RETURNS uuid AS $$
  SELECT clinic_id 
  FROM public.clinic_staff 
  WHERE clinic_staff.user_id = $1 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = $1
    AND users.role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Step 7: Create Test Data

```sql
-- สร้าง test clinic
INSERT INTO public.clinics (
  clinic_code,
  clinic_name,
  address,
  city,
  province,
  phone_number,
  is_active
) VALUES (
  'CLI001',
  'Test Clinic',
  '123 Test Street',
  'Bangkok',
  'Bangkok',
  '0812345678',
  true
) RETURNING id;

-- บันทึก clinic_id ที่ได้ แล้วใช้สร้าง test data อื่นๆ
```

## ✅ Verification Queries

### ตรวจสอบ Tables

```sql
-- นับจำนวน tables
SELECT COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';
-- ควรได้ 99 tables

-- ดู tables ทั้งหมด
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### ตรวจสอบ RLS

```sql
-- ตรวจสอบว่า RLS เปิดอยู่
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'Enabled'
    ELSE 'Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### ตรวจสอบ Policies

```sql
-- นับจำนวน policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

### ตรวจสอบ Foreign Keys

```sql
-- ดู foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

## 🎯 Next Steps After Database Setup

1. **Update Environment Variables** ใน v0 Project
2. **Test Connection** ด้วย `lib/supabase/client.ts`
3. **Create First User** ผ่าน Supabase Auth
4. **Assign Role** ใน `users` table
5. **Test API Routes** เริ่มจาก auth endpoints

---

**หมายเหตุ:** ถ้าพบปัญหาในขั้นตอนใด ให้ดูใน `/DATABASE_SETUP_GUIDE.md` สำหรับวิธีแก้ไขโดยละเอียด
