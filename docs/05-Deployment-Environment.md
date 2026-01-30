# 🚀 Deployment & Environment Setup

## 1. Environment Variables (.env.local)
เพื่อให้ระบบทำงานได้สมบูรณ์ จำเป็นต้องตั้งค่า Key ต่อไปนี้:

### 🔹 Supabase (Core)
- `NEXT_PUBLIC_SUPABASE_URL`: URL ของ Supabase Project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key สำหรับ Client-side
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (ใช้ใน Server-side เท่านั้น)

### 🔹 AI Services
- `GOOGLE_GEMINI_API_KEY`: สำหรับ Gemini 1.5 Analysis (Pro & Flash)
- `GOOGLE_CLOUD_VISION_KEY`: สำหรับ Image Processing

### 🔹 Communication & Email
- `RESEND_API_KEY`: สำหรับส่ง Email แจ้งเตือน/ใบเสนอราคา
- `RESEND_FROM_EMAIL`: Email ต้นทาง (เช่น noreply@cliniciq.com)

### 🔹 Deployment Optimization (Optional)
- `FAST_BUILD=1`: เปิดโหมด Build เร็วบน Vercel (ข้ามบางขั้นตอนที่ไม่จำเป็นใน Production)

## 2. Supabase Setup Steps
1. **Create Project**: สร้างโปรเจกต์ใหม่ใน Supabase Dashboard
2. **Database Migrations**: รัน SQL Scripts ในโฟลเดอร์ `/supabase/migrations` ตามลำดับวันที่
3. **Storage Buckets**: สร้าง Buckets ชื่อ `analysis-images` (Private) และ `clinic-assets` (Public)
4. **Auth Configuration**:
   - เปิดใช้งาน Email Provider
   - ตั้งค่า Site URL และ Redirect URLs ให้ตรงกับ Vercel Domain

## 3. Vercel Configuration
- **Framework Preset**: Next.js
- **Node.js Version**: 22.x (LTS)
- **Install Command**: `pnpm install`
- **Build Command**: `pnpm build`
- **Environment Variables**: ใส่ Key ทั้งหมดจากข้อ 1 ใน Vercel Dashboard

## 4. Production Smoke Test Checklist
- [ ] Login/Register ทำงานปกติ
- [ ] อัปโหลดรูปภาพไปที่ Storage ได้
- [ ] วิเคราะห์ผิว AI แสดงผลถูกต้อง
- [ ] RLS ป้องกันการดูข้อมูลข้าม Clinic ได้จริง
- [ ] ส่ง Email ผ่าน Resend สำเร็จ
