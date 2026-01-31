# 🚀 BN-Aura: Deployment & Environment Setup (Production Ready)

เพื่อให้ระบบทำงานได้สมบูรณ์ตามมาตรฐาน Enterprise-grade จำเป็นต้องตั้งค่าดังนี้:

## 1. Environment Variables (.env.local)

### 🔹 Supabase Infrastructure
- `NEXT_PUBLIC_SUPABASE_URL`: API Endpoint ของโปรเจกต์
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client-side access key
- `SUPABASE_SERVICE_ROLE_KEY`: Key สำหรับ Server-side operations (ข้าม RLS)

### 🔹 AI Neural Engine (via Vercel AI Gateway)
- `VERCEL_AI_GATEWAY_URL`: Orchestration URL สำหรับ Caching และ Rate Limiting
- `GOOGLE_GEMINI_API_KEY`: Key สำหรับ Gemini 1.5 Pro (Clinical) และ Flash (Quick Scan)

### 🔹 Digital Communication
- `RESEND_API_KEY`: สำหรับส่ง Email เชิญพนักงานและใบเสนอราคา
- `RESEND_FROM_EMAIL`: Address ต้นทางที่ได้รับการรับรอง (เช่น clinic@excellence.com)

## 2. Infrastructure Setup Steps
1. **Database Strategy**: รัน Migrations ทั้งหมดใน `/supabase/migrations` (รวมถึงระบบ Notification และ Workflow ล่าสุด)
2. **Storage Provisioning**:
   - `analysis-images`: Private bucket สำหรับภาพสแกนผิว
   - `clinic-assets`: Public bucket สำหรับ Branding assets
3. **Auth Governance**: ปิด Self-signup และใช้ระบบ Invitation-only ผ่าน Admin Console เท่านั้น

## 3. Production Optimization
- **Node.js**: แนะนำเวอร์ชัน 22.x LTS ขึ้นไป
- **Edge Runtime**: ใช้ Edge functions สำหรับการตรวจสอบสิทธิ์และ Quota เพื่อลด Latency
- **Monitoring**: เชื่อมต่อ Sentry สำหรับ Error Tracking และ Vercel Analytics สำหรับ Performance

---
**สถานะการติดตั้ง**: ✅ **VERIFIED FOR PRODUCTION**
**อัปเดตล่าสุด**: 31 มกราคม 2569
