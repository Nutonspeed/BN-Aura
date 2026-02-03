# BN-Aura Session Configuration Report

## วันที่: 2 กุมภาพันธ์ 2026
เวลา: 20:20 น.

## ปัญหาที่พบ:
- Session timeout เร็วเกินไป (5-10 นาที)
- ผู้ใช้ต้อง login บ่อย
- ส่งผลต่อการทดสอบระบบ

## วิธีแก้ไขที่ดำเนินการ:

### 1. ✅ สร้าง Middleware (middleware.ts)
- จัดการ session refresh อัตโนมัติ
- Redirect ไปหน้า login ถ้าไม่มี session
- ป้องกัน API routes สำหรับผู้ที่ไม่ได้ login

### 2. ✅ ตั้งค่า JWT Expiry
- เพิ่ม `SUPABASE_JWT_EXPIRY=28800` (8 ชั่วโมง)
- แก้ไขใน `.env.local.example`
- อัปเดต admin client ให้รองรับค่านี้

### 3. ✅ อัปเดต useAuth Hook
- เพิ่ม auto refresh ทุก 30 นาที
- Check session expiry ก่อน refresh
- Refresh ถ้า session จะหมดใน 1 ชั่วโมง

### 4. ✅ สร้าง API Endpoints
- `/api/auth/refresh` - สำหรับ refresh session
- `/api/auth/refresh` GET - ตรวจสอบ session status
- พร้อม error handling

## การตั้งค่าที่แนะนำ:

### Development Environment:
```env
SUPABASE_JWT_EXPIRY=28800  # 8 ชั่วโมง
```

### Production Environment:
```env
SUPABASE_JWT_EXPIRY=3600   # 1 ชั่วโมง (security best practice)
```

## วิธีใช้งาน:

### 1. ตั้งค่าใน .env.local
```bash
# เพิ่มบรรทัดนี้ใน .env.local
SUPABASE_JWT_EXPIRY=28800
```

### 2. Restart Development Server
```bash
npm run dev
```

### 3. Login ใหม่
- Session จะมีอายุ 8 ชั่วโมง
- Auto refresh ทุก 30 นาที
- ไม่ต้อง login ซ้ำบ่อย

## การทำงานของระบบ:

1. **User Login** → Session ถูกสร้างพร้อม expiry 8 ชั่วโมง
2. **Every 30 min** → useAuth check session expiry
3. **If < 1 hour left** → Auto refresh session
4. **Middleware** → Refresh session ทุก request
5. **If expired** → Redirect to login

## ประโยชน์:

- ✅ ไม่ต้อง login ซ้ำระหว่างทำงาน
- ✅ Session ยังคงปลอดภัย (auto refresh)
- ✅ สะดวกสำหรับการทดสอบระบบ
- ✅ ปรับแต่งได้ตามสภาพแวดล้อม

## สถานะ:
- ✅ Configuration พร้อมใช้งาน
- ✅ Testing ผ่าน
- ✅ Production ready

## หมายเหตุ:
- ค่าเริ่มต้นของ Supabase คือ 1 ชั่วโมง
- สามารถปรับได้ตามความเหมาะสม
- Production ควรใช้ 1 ชั่วโมงเพื่อความปลอดภัย
- Development สามารถใช้ 8 ชั่วโมงได้
