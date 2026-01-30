# 🛤️ BN-Aura: Development Roadmap for AI Rebuild

เอกสารนี้ใช้สำหรับให้ AI (เช่น Cascade/Devin) ทำตามเพื่อสร้างโปรเจกต์ BN-Aura ขึ้นมาใหม่ทีละขั้นตอน

## Phase 1: Foundation (Day 1-2)
1. **Project Initialization**: 
   - ติดตั้ง Next.js 16, Tailwind CSS, และ TypeScript
   - ตั้งค่า Folder Structure ตาม `03-Frontend-Architecture.md`
2. **Database & Auth**:
   - เชื่อมต่อ Supabase
   - สร้าง Schema และ RLS Policies ตาม `02-Database-Security-Spec.md`
   - ทำระบบ Login/Logout พื้นฐาน

## Phase 2: Core Clinic Infrastructure (Day 3-4)
1. **Multi-tenant Logic**:
   - ทำ Middleware สำหรับตรวจสอบ Clinic Access และ Role
   - สร้างหน้า Dashboard สำหรับ Clinic Owner
2. **Smart Service Catalog**:
   - ระบบจัดการ Treatments และ Products แยกรายคลินิก
   - **Smart Mapping**: เชื่อมโยง Standard Categories เข้ากับ Local Inventory

## Phase 3: AI Hybrid Pipeline (Day 5-7)
1. **Magic Scan UI (The Ritual)**:
   - เชื่อมต่อ MediaPipe และทำ Digital Pre-processing (UV/Redness Simulation)
   - พัฒนา UI ให้มีความ "ขลัง" และแอนิเมชันระดับพรีเมียม
2. **Cognitive Reasoning (Gemini 2.5 Pro)**:
   - ระบบวิเคราะห์เชิงลึกที่แนะนำทั้งหัตถการ (Treatments) และผลิตภัณฑ์ (Products)
   - ปรับจูน Prompts ให้เน้น Sales-driven และ Urgency

## Phase 4: Sales & CRM Engine (Day 8-10)
1. **Leads & Digital Proposals**:
   - ระบบจัดการข้อมูลลูกค้าพร้อม AI Lead Scoring (0-100)
   - ระบบสร้างใบเสนอราคาแบบ Interactive ที่ดึงข้อมูลจาก Smart Mapping อัตโนมัติ
2. **Quota & Add-on Management**:
   - ระบบโควตาสแกนรายคลินิก (Monthly Quota)
   - ระบบซื้อ Top-up Scan รายครั้ง (Pay-as-you-go)
   - Dashboard สำหรับเจ้าของคลินิกตรวจสอบการใช้งาน AI
3. **Real-time Interaction**:
   - ระบบแชทและแจ้งเตือนผ่าน Supabase Realtime

## Phase 5: Final Polish & Deployment (Day 11-14)
1. **UI/UX Refinement**:
   - ใส่ Animations ด้วย Framer Motion
   - ตรวจสอบ Responsive ทุกหน้าจอ
2. **Production Setup**:
   - ตั้งค่า Sentry และ Performance Monitoring
   - Deploy ขึ้น Vercel
