# 📋 BN-Aura: กระบวนการทำความเข้าใจบริบทโปรเจค (Project Context Understanding Process)

## 🎯 วัตถุประสงค์

เอกสารนี้ออกแบบมาเพื่อเป็นแนวทางในการทำความเข้าใจโปรเจค BN-Aura อย่างครบถ้วน สำหรับหัวหน้าวิศวกรโครงสร้าง (Principal/Staff Engineer) ที่จะเข้ามารับผิดชอบงานต่อ

## 📌 ภาพรวมโปรเจค (Project Overview)

BN-Aura เป็นแพลตฟอร์ม Enterprise-grade สำหรับจัดการคลินิกความงามระดับ Premium ที่รวมระบบต่างๆ เข้าด้วยกัน:
- **AI Skin Analysis** - ระบบวิเคราะห์ผิวหน้าด้วย AI
- **3D/AR Visualization** - การจำลองผลลัพธ์แบบ 3 มิติ
- **CRM & Sales Intelligence** - ระบบจัดการลูกค้าและข้อมูลการขาย
- **Unified Workflow Management** - ระบบจัดการ Workflow แบบครบวงจร
- **Multi-tenant Architecture** - สถาปัตยกรรมหลายผู้เช่าที่ปลอดภัย

## 🏗️ กระบวนการทำความเข้าใจโปรเจค (6 ขั้นตอน)

### ขั้นที่ 1: ศึกษาเอกสารพื้นฐาน (Foundation Documents)

**เอกสารที่ต้องอ่านก่อน:**
1. **README.md** - ข้อมูลทั่วไป ฟีเจอร์หลัก และวิธีการติดตั้ง
2. **PROJECT_SUMMARY.md** - สรุปสถานะโปรเจคและสิ่งที่เสร็จสิ้น
3. **docs/01-Project-Blueprint.md** - วิสัยทัศน์และสถาปัตยกรรมระดับสูง
4. **docs/07-SQL-Schema-Definition.md** - โครงสร้างฐานข้อมูลฉบับสมบูรณ์
5. **COMPREHENSIVE_PROJECT_PLAN.md** - แผนงานโดยละเอียด

**จุดที่ควรให้ความสำคัญ:**
- Business Model และ Revenue Streams
- User Personas และ Role-based Access
- Technology Stack ที่เลือกใช้
- Multi-tenancy Requirements

### ขั้นที่ 2: ทำความเข้าใจสถาปัตยกรรมเทคโนโลยี (Technology Architecture)

**Frontend Stack:**
- **Framework**: Next.js 15+ ด้วย App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui (Glassmorphism Design)
- **State Management**: Zustand + React Query
- **Animations**: Framer Motion
- **Internationalization**: next-intl (ไทย/อังกฤษ)

**Backend Stack:**
- **Database**: PostgreSQL บน Supabase
- **Authentication**: Supabase Auth + JWT
- **Real-time**: Supabase Realtime
- **AI/ML**: Google Gemini 1.5 (Pro & Flash)
- **File Storage**: Supabase Storage

**Infrastructure:**
- **Deployment**: Vercel (Production)
- **Environment**: Production URL: bn-aura.vercel.app
- **Monitoring**: Built-in Analytics + Error Tracking
- **Testing**: Playwright (E2E)

### ขั้นที่ 3: วิเคราะห์โครงสร้างโค้ด (Code Structure Analysis)

**โครงสร้าง Directory หลัก:**
```
/app                    # Next.js App Router
├── [locale]           # Multi-language support
│   ├── (auth)         # Authentication flows
│   ├── (dashboard)    # Main application
│   │   ├── admin      # Super Admin console
│   │   ├── clinic     # Clinic management
│   │   ├── sales      # Sales & AI tools
│   │   ├── beautician # Clinical workflows
│   │   └── customer   # Customer portal
/components            # Reusable components
├── ui                 # Base UI components
├── analytics          # BI & Metrics
├── sales              # Sales-specific tools
├── customer           # Customer features
└── beautician         # Clinical tools
/lib                   # Core utilities
├── ai                 # AI integrations
├── api                # API client
├── auth               # Authentication logic
└── utils              # Helper functions
/hooks                 # Custom React hooks
/supabase/migrations   # Database schema
```

**ไฟล์สำคัญที่ต้องเข้าใจ:**
- `app/[locale]/layout.tsx` - Root layout และ providers
- `app/[locale]/(dashboard)/layout.tsx` - Dashboard navigation
- `hooks/useAuth.tsx` - Authentication & Role management
- `lib/api/client.ts` - API client มาตรฐาน
- `lib/ai/gemini.ts` - AI integration logic

### ขั้นที่ 4: ศึกษาโมเดลข้อมูล (Data Model Study)

**Core Entities:**
1. **Clinics** - หน่วยงานหลัก (Multi-tenant root)
2. **Users** - ผู้ใช้ระบบทั้งหมด
3. **Clinic_Staff** - การ mapping พนักงานกับคลินิก
4. **Customers** - ข้อมูลลูกค้า
5. **Skin_Analyses** - ผลการวิเคราะห์ผิว
6. **Workflow_States** - สถานะ workflow
7. **Task_Queue** - รายการงานสำหรับ staff

**ความสัมพันธ์สำคัญ:**
- Multi-tenancy ผ่าน `clinic_id`
- Row Level Security (RLS) สำหรับการแยกข้อมูล
- Role-based access ผ่าน `clinic_staff` table

### ขั้นที่ 5: ทำความเข้าใจ Business Logic

**Key Workflows:**

1. **Sales Workflow:**
   ```
   Lead Creation → Magic Scan → AI Analysis → Proposal → Payment → Treatment
   ```

2. **Clinical Workflow:**
   ```
   Receive Task → Review Protocol → Perform Treatment → Record Results → Follow-up
   ```

3. **Commission System:**
   - Auto-calculate ตาม treatment และแพ็คเกจ
   - Track ผ่าน `sales_commissions` table

4. **AI Analysis Pipeline:**
   - MediaPipe สำหรับ Face Detection
   - Gemini AI สำหรับ Analysis & Recommendations
   - Store ผลลัพธ์ใน `skin_analyses`

### ขั้นที่ 6: ตรวจสอบการติดตั้งและการทำงาน (Setup Verification)

**ขั้นตอนติดตั้ง:**
```bash
# 1. Clone repository
git clone [repository-url]
cd bn-aura

# 2. Install dependencies
npm install
# หรือ pnpm install

# 3. Environment setup
cp .env.example .env.local
# ตั้งค่า Supabase credentials และ API keys

# 4. Run development
npm run dev
```

**การตรวจสอบหลังติดตั้ง:**
1. เข้า http://localhost:3000
2. ทดสอบ authentication flow
3. ตรวจสอบ database connection
4. ทดสอบ AI analysis feature
5. Verify role-based access

## 🔍 จุดที่ต้องพิจารณาเป็นพิเศษ (Critical Considerations)

### 1. Security
- **Multi-tenant Isolation**: ต้องตรวจสอบ RLS policies ทุก table
- **API Security**: Rate limiting และ input validation
- **Data Encryption**: Sensitive data ต้องถูกเข้ารหัส

### 2. Performance
- **Database Indexes**: ตรวจสอบ indexes สำหรับ queries หลัก
- **Image Processing**: การประมวลผลภาพสำหรับ AI analysis
- **Real-time Updates**: Supabase realtime subscriptions

### 3. Scalability
- **Tenant Scaling**: รองรับคลินิกหลายสาขา
- **AI Service Limits**: Quota management สำหรับ Gemini API
- **File Storage**: การจัดการรูปภาพและข้อมูลขนาดใหญ่

### 4. Business Rules
- **Commission Calculation**: ต้องถูกต้องตามโครงสร้างราคา
- **Treatment Protocols**: Standardized procedures
- **Customer Journey**: End-to-end experience consistency

## 📊 เครื่องมือช่วยวิเคราะห์ (Analysis Tools)

### 1. Database Analysis
```sql
-- Check table sizes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 2. Performance Monitoring
- Vercel Analytics
- Supabase Dashboard
- Chrome DevTools
- React Query DevTools

### 3. Code Quality
- ESLint configuration
- TypeScript strict mode
- Prettier formatting

## 🚀 Next Steps หลังทำความเข้าใจ

1. **Setup Development Environment** สำหรับทีม
2. **Review Current Sprint** และ backlog
3. **Identify Technical Debt** ที่ต้องจัดการ
4. **Meet with Team Members** ทำความเข้าใจ roles และ responsibilities
5. **Review Monitoring & Alerting** setup
6. **Plan Architecture Improvements** (ถ้ามี)

## 📞 ทรัพยากรเพิ่มเติม

- **Slack/Discord**: ช่องทางสื่อสารทีม
- **Documentation**: `/docs` folder
- **API Documentation**: Auto-generated จาก route handlers
- **Database Schema**: ใน Supabase Dashboard
- **Deployment Logs**: Vercel dashboard

---

**หมายเหตุ**: เอกสารนี้เป็นเวอร์ชันแรกเริ่ม ควรอัปเดตเป็นประจำเมื่อมีการเปลี่ยนแปลงสำคัญในโปรเจค

**อัปเดตล่าสุด**: 2 กุมภาพันธ์ 2569
