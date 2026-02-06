# 🗄️ Database Setup Guide - BN-Aura

## ⚠️ สิ่งสำคัญที่ต้องทำก่อนรัน SQL

### 1. สร้าง Custom Types (Enums) ก่อน

```sql
-- สร้าง enum types ก่อนสร้าง tables
CREATE TYPE public.clinic_role AS ENUM (
  'super_admin',
  'clinic_owner', 
  'clinic_admin',
  'clinic_staff',
  'doctor',
  'customer'
);

CREATE TYPE public.user_status AS ENUM (
  'active',
  'inactive', 
  'suspended',
  'pending'
);

CREATE TYPE public.notification_type AS ENUM (
  'appointment',
  'treatment',
  'payment',
  'system',
  'marketing'
);

-- เพิ่ม enum types อื่นๆ ตามที่ใช้ใน schema
```

### 2. ลำดับการสร้าง Tables

**⚠️ ต้องสร้างตามลำดับนี้เพื่อหลีกเลี่ยง foreign key errors:**

#### Phase 1: Core Tables (ไม่มี dependencies)
```sql
-- 1. สร้าง core tables ที่ไม่ depend กับอะไร
CREATE TABLE public.clinics (...);
CREATE TABLE public.billing_plans (...);
CREATE TABLE public.treatments (...);
```

#### Phase 2: User-Related Tables
```sql
-- 2. auth.users มีอยู่แล้วจาก Supabase Auth
-- สร้าง tables ที่ reference auth.users
CREATE TABLE public.users (...);
CREATE TABLE public.customers (...);
CREATE TABLE public.clinic_staff (...);
```

#### Phase 3: Dependent Tables
```sql
-- 3. สร้าง tables ที่ depend กับ tables ข้างต้น
CREATE TABLE public.appointments (...);
CREATE TABLE public.skin_analyses (...);
CREATE TABLE public.invoices (...);
-- ... etc
```

### 3. สร้าง RLS Policies

```sql
-- Enable RLS for all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ... enable สำหรับทุก table

-- สร้าง policies ตามบทบาท
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Clinic staff can view clinic data"
  ON public.clinics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_staff
      WHERE clinic_staff.clinic_id = clinics.id
      AND clinic_staff.user_id = auth.uid()
    )
  );
```

### 4. สร้าง Indexes สำหรับ Performance

```sql
-- Indexes สำคัญสำหรับการ query ที่เร็ว
CREATE INDEX idx_appointments_clinic_date 
  ON public.appointments(clinic_id, appointment_date);

CREATE INDEX idx_customers_clinic_phone 
  ON public.customers(clinic_id, phone_number);

CREATE INDEX idx_skin_analyses_customer_date 
  ON public.skin_analyses(customer_id, created_at DESC);

CREATE INDEX idx_invoices_clinic_status 
  ON public.invoices(clinic_id, status);

-- เพิ่ม indexes อื่นๆ ตามการใช้งาน
```

### 5. สร้าง Functions และ Triggers

```sql
-- Function สำหรับ auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger สำหรับทุก table ที่มี updated_at
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ทำซ้ำสำหรับทุก table
```

## 🚀 ขั้นตอนการ Setup Database ใหม่

### Step 1: เตรียม Supabase Project

1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. สร้าง New Project หรือใช้ project ที่มีอยู่
3. ไปที่ **SQL Editor**

### Step 2: รัน SQL ตามลำดับ

```bash
# ใน Supabase SQL Editor ให้รันตามลำดับ:

1. สร้าง Custom Types (enums)
2. สร้าง Core Tables (Phase 1)
3. สร้าง User-Related Tables (Phase 2)  
4. สร้าง Dependent Tables (Phase 3)
5. Enable RLS + สร้าง Policies
6. สร้าง Indexes
7. สร้าง Functions & Triggers
```

### Step 3: Verify Database

```sql
-- ตรวจสอบว่า tables ถูกสร้างครบ
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ควรได้ 99 tables

-- ตรวจสอบ RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Step 4: เพิ่ม Environment Variables

```bash
# ใน v0 Project Settings → Vars
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Test Connection

```typescript
// ใน v0 console หรือ API route
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('clinics').select('*').limit(1);

console.log('[v0] Database test:', { data, error });
```

## 📋 Checklist การ Setup

- [ ] Custom types (enums) ถูกสร้างแล้ว
- [ ] Tables ทั้งหมด 99 tables ถูกสร้างแล้ว
- [ ] RLS enabled สำหรับทุก table
- [ ] RLS policies ถูกสร้างครบถ้วน
- [ ] Indexes สำคัญถูกสร้างแล้ว
- [ ] Functions & Triggers ทำงานได้
- [ ] Environment variables ถูกตั้งค่าแล้ว
- [ ] Connection test ผ่าน
- [ ] สร้าง test user account แล้ว
- [ ] สร้าง test clinic record แล้ว

## 🐛 Troubleshooting

### ปัญหา: Foreign key constraint fails

**สาเหตุ:** สร้าง child table ก่อน parent table

**วิธีแก้:**
1. ลบ table ที่สร้างผิดลำดับ: `DROP TABLE IF EXISTS table_name CASCADE;`
2. สร้าง parent table ก่อน
3. สร้าง child table ใหม่

### ปัญหา: Type "clinic_role" does not exist

**สาเหตุ:** ไม่ได้สร้าง enum types ก่อน

**วิธีแก้:**
```sql
-- สร้าง type ก่อน
CREATE TYPE public.clinic_role AS ENUM (...);
-- แล้วค่อยสร้าง table
```

### ปัญหา: Permission denied for table

**สาเหตุ:** RLS policies ไม่ถูกต้อง

**วิธีแก้:**
1. ตรวจสอบว่า user login แล้ว: `SELECT auth.uid();`
2. ตรวจสอบ policies: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. แก้ไข policy ให้ถูกต้อง

### ปัญหา: NULL constraint violation

**สาเหตุ:** พยายามสร้าง record โดยไม่ส่ง required fields

**วิธีแก้:**
```typescript
// ตรวจสอบ required fields ใน table schema
const { data, error } = await supabase
  .from('appointments')
  .insert({
    clinic_id: 'xxx',
    customer_id: 'xxx',
    staff_id: 'xxx',
    // ... ส่งทุก NOT NULL fields
  });
```

## 🔒 Security Best Practices

1. **ใช้ RLS เสมอ** - ห้ามปิด RLS ใน production
2. **Service Role Key** - เก็บเป็นความลับ ใช้เฉพาะ server-side
3. **Anon Key** - ใช้สำหรับ client-side เท่านั้น
4. **Validate Input** - ใช้ Zod หรือ validation library
5. **Audit Logs** - เปิดใช้งาน audit_logs table

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Project Analysis: `/CODEBASE_ANALYSIS.md`
