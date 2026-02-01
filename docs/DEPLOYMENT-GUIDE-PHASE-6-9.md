# 🚀 Deployment Guide: Phase 6-9 Implementation
## AI Sales Assistant & Customer Journey Automation

---

## ⚠️ **IMPORTANT: Read Before Deployment**

ระบบนี้ได้รับการออกแบบให้ทำงานกับ **ฐานข้อมูลที่มีอยู่แล้ว** ใน BN-Aura Production

### **สิ่งที่ต้องรู้:**
1. ✅ **ฐานข้อมูลมี 27 migrations แล้ว**
2. ✅ **มี tables สำคัญอยู่แล้ว:** `customers`, `notifications`, `users`, `clinics`
3. ✅ **Migration ใหม่ออกแบบให้ไม่ conflict กับ schema เดิม**
4. ⚠️ **ต้อง test บน staging ก่อน production**

---

## 📦 **ไฟล์ที่สร้างทั้งหมด (11 ไฟล์)**

### **✅ ปลอดภัย - Accept ได้เลย (9 ไฟล์)**

#### **Backend Logic:**
1. `lib/ai/salesAssistant.ts` - AI Sales Coach Engine
2. `lib/ai/businessAdvisor.ts` - Business Intelligence AI
3. `lib/workflow/workflowEngine.ts` - Workflow State Management
4. `lib/workflow/eventBroadcaster.ts` - Real-time Communication
5. `lib/workflow/taskQueue.ts` - Smart Task Queue
6. `lib/customer/followUpAutomation.ts` - Follow-up Automation
7. `lib/customer/loyaltySystem.ts` - Loyalty & Gamification

#### **API & Hooks:**
8. `app/api/workflow/management/route.ts` - Workflow APIs
9. `hooks/useWorkflow.tsx` - React Hooks

#### **UI Components:**
10. `components/customer/LoyaltyDashboard.tsx` - Customer Portal

#### **Documentation:**
11. `docs/CUSTOMER-JOURNEY-AUTOMATION-GUIDE.md` - Complete Guide

---

### **⚠️ ระวัง - ต้อง Review และ Test (2 ไฟล์)**

#### **Database Migrations:**
1. `supabase/migrations/20260131150000_workflow_system_safe.sql`
2. `supabase/migrations/20260131150001_followup_loyalty_system.sql`

**เหตุผล:**
- สร้าง tables ใหม่ 14 ตาราง
- แก้ไข `notifications` table ที่มีอยู่แล้ว
- ต้องทดสอบบน staging environment ก่อน

---

## 🔧 **ขั้นตอนการ Deploy**

### **Step 1: Accept TypeScript/React Files**
```bash
# Accept ไฟล์ทั้ง 9 ไฟล์ที่ปลอดภัย
# ไฟล์เหล่านี้ไม่กระทบฐานข้อมูล
```

### **Step 2: Review Migration Files**
```bash
# อ่าน migration files ให้เข้าใจก่อน
cat supabase/migrations/20260131150000_workflow_system_safe.sql
cat supabase/migrations/20260131150001_followup_loyalty_system.sql
```

### **Step 3: Test Migrations on Staging**
```bash
# สร้าง Development Branch บน Supabase
supabase branches create staging-phase-6-9

# Apply migrations บน branch
supabase db push --db-url <staging-url>

# ตรวจสอบว่า migrations สำเร็จ
supabase db diff
```

### **Step 4: Verify Database Schema**
```sql
-- ตรวจสอบ tables ที่สร้างใหม่
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'workflow_states', 'workflow_actions', 'task_queue',
  'followup_rules', 'loyalty_profiles', 'point_transactions'
);

-- ตรวจสอบ columns ใหม่ใน notifications
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('priority', 'action_url', 'read_at', 'expires_at', 'dismissed');
```

### **Step 5: Test API Endpoints**
```bash
# Test Workflow API
curl -X POST http://localhost:3000/api/workflow/management \
  -H "Content-Type: application/json" \
  -d '{"action": "list_workflows"}'

# ตรวจสอบว่าไม่มี error
```

### **Step 6: Deploy to Production**
```bash
# เมื่อทดสอบผ่านแล้ว
supabase db push --linked

# Verify deployment
supabase migration list
```

---

## 🧪 **Testing Checklist**

### **Database Tests:**
- [ ] Migration files apply สำเร็จ
- [ ] ไม่มี foreign key errors
- [ ] RLS policies ทำงานถูกต้อง
- [ ] Indexes ถูกสร้าง
- [ ] Functions/Triggers ทำงาน

### **API Tests:**
- [ ] Workflow APIs ตอบกลับถูกต้อง
- [ ] Authentication ทำงาน
- [ ] Multi-tenant isolation ทำงาน
- [ ] Error handling ถูกต้อง

### **UI Tests:**
- [ ] Components render ได้
- [ ] Data fetching ทำงาน
- [ ] Real-time updates ทำงาน
- [ ] Mobile responsive

---

## 🔍 **Tables ที่สร้างใหม่**

### **Workflow System (5 tables):**
1. `workflow_states` - สถานะ Customer Journey
2. `workflow_actions` - ประวัติการกระทำ
3. `task_queue` - งานที่ต้องทำ
4. `workflow_events` - Real-time events
5. `automation_rules` - กฎอัตโนมัติ

### **Follow-up System (4 tables):**
6. `followup_rules` - กฎการติดตาม
7. `followup_executions` - ประวัติการส่ง
8. `customer_preferences` - การตั้งค่าลูกค้า
9. `followup_templates` - Templates สำเร็จรูป
10. `customer_journey_events` - Event tracking

### **Loyalty System (4 tables):**
11. `loyalty_profiles` - ข้อมูลสมาชิก
12. `point_transactions` - ประวัติแต้ม
13. `achievements` - Achievement definitions
14. `loyalty_rewards` - รางวัลที่แลกได้

### **Modified Tables (1 table):**
15. `notifications` - เพิ่ม columns: `priority`, `action_url`, `read_at`, `expires_at`, `dismissed`

---

## 🔒 **Security Considerations**

### **Row Level Security (RLS):**
- ✅ ทุก table มี RLS enabled
- ✅ Users เห็นเฉพาะข้อมูลใน clinic ตัวเอง
- ✅ Multi-tenant isolation ทำงานถูกต้อง

### **API Security:**
- ✅ Authentication required
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection prevention

---

## 📊 **Performance Optimization**

### **Indexes Created:**
```sql
-- Workflow indexes (8 indexes)
idx_workflow_states_clinic_stage
idx_workflow_states_customer
idx_workflow_states_assigned_sales
idx_workflow_actions_workflow
idx_task_queue_assigned
idx_task_queue_priority
idx_workflow_events_workflow
idx_notifications_user_unread

-- Follow-up indexes (6 indexes)
idx_followup_rules_clinic_active
idx_followup_executions_scheduled
idx_followup_executions_customer
idx_customer_preferences_customer
idx_journey_events_customer

-- Loyalty indexes (4 indexes)
idx_loyalty_profiles_customer
idx_loyalty_profiles_referral
idx_point_transactions_customer
```

---

## 🐛 **Troubleshooting**

### **Migration Fails:**
```bash
# ดู error log
supabase migration repair

# Rollback migration
supabase db reset

# Apply migrations ทีละตัว
supabase migration up --file 20260131150000_workflow_system_safe.sql
```

### **Foreign Key Errors:**
```sql
-- ตรวจสอบว่า referenced tables มีอยู่
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('customers', 'users', 'clinics');

-- ตรวจสอบ foreign key constraints
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

### **RLS Policy Errors:**
```sql
-- ตรวจสอบ policies
SELECT * FROM pg_policies WHERE tablename = 'workflow_states';

-- Test RLS
SET ROLE authenticated;
SELECT * FROM workflow_states LIMIT 1;
```

---

## 📈 **Monitoring**

### **Database Metrics:**
```sql
-- ตรวจสอบจำนวน records
SELECT 
  'workflow_states' as table_name, COUNT(*) as count FROM workflow_states
UNION ALL
SELECT 'task_queue', COUNT(*) FROM task_queue
UNION ALL
SELECT 'loyalty_profiles', COUNT(*) FROM loyalty_profiles;

-- ตรวจสอบ performance
SELECT schemaname, tablename, seq_scan, idx_scan 
FROM pg_stat_user_tables 
WHERE tablename LIKE 'workflow%';
```

### **API Monitoring:**
```bash
# ดู API logs
vercel logs --filter="workflow"

# ตรวจสอบ response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/workflow/management
```

---

## 🔄 **Rollback Plan**

หากเกิดปัญหาหลัง deployment:

### **Step 1: Backup Current State**
```bash
# Backup database
supabase db dump > backup_before_rollback.sql
```

### **Step 2: Rollback Migrations**
```bash
# Rollback ทั้ง 2 migrations
supabase migration down 20260131150001_followup_loyalty_system
supabase migration down 20260131150000_workflow_system_safe
```

### **Step 3: Restore Code**
```bash
# Revert TypeScript files
git revert <commit-hash>
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Migrations applied successfully
- [ ] All tables created
- [ ] Indexes working
- [ ] RLS policies active
- [ ] API endpoints responding
- [ ] UI components rendering
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Monitoring setup
- [ ] Documentation updated

---

## 📞 **Support**

หากพบปัญหา:
1. ตรวจสอบ error logs
2. ดู troubleshooting section
3. Test บน staging ก่อน
4. Backup ก่อนทำอะไร

---

## 🎯 **Expected Results**

หลัง deployment สำเร็จ คุณจะได้:

### **For Sales Team:**
- ✅ AI Sales Coach ให้คำแนะนำ Real-time
- ✅ Hot Leads Alert แจ้งเตือนลูกค้าที่มีโอกาส
- ✅ Smart Task Queue จัดการงานอัตโนมัติ

### **For Clinic Owners:**
- ✅ Business Intelligence Dashboard
- ✅ Natural Language Query
- ✅ Smart Alerts & Anomaly Detection

### **For Customers:**
- ✅ Loyalty Program with 5 tiers
- ✅ Achievement System
- ✅ Automated Follow-ups
- ✅ Personal Customer Portal

---

**🎉 ระบบพร้อม Deploy แล้ว!**

ทำตามขั้นตอนอย่างระมัดระวัง และทดสอบให้ดีก่อน deploy production
