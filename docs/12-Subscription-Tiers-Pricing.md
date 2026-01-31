# 💎 BN-Aura: Subscription Tiers & Pricing (Production v2.0)

เอกสารฉบับนี้กำหนดโครงสร้างราคาและสิทธิประโยชน์ของแต่ละแพ็กเกจสำหรับ BN-Aura เพื่อควบคุม Quota และการเข้าถึงฟีเจอร์ระดับสูง

## 1. Intelligence Tiers Overview

| Feature | **Starter (Base)** | **Professional (Growth)** | **Enterprise (Elite)** |
|---------|---------------------|--------------------------|--------------------------|
| **AI Analysis Node** | 100 Scans / Month | 1,000 Scans / Month | Unlimited* |
| **Neural Engine** | Gemini 1.5 Flash | Gemini 1.5 Pro & Flash | Gemini 1.5 Pro (Custom) |
| **Workflow Nodes** | 1 Clinic / 1 Branch | Up to 5 Branches | Global Cluster |
| **Personnel Limit** | Max 3 Staff | Max 15 Staff | Unlimited |
| **Business Intel** | Basic Revenue | Advanced BI + Forecast | Custom BI Engine |
| **Commission System** | Standard Rate | Custom per Treatment | Multi-level Tracking |
| **Communication** | System Chat | Integrated Advisor Chat | Full White-label Chat |

## 2. Technical Governance (Hard Limits)

### 🔹 AI Quota Orchestration
- ระบบตรวจสอบ Quota แบบ Real-time ผ่าน `usage_metrics` และ Vercel AI Gateway
- เมื่อเกินกำหนด ระบบจะตัดเข้าสู่โหมด **Pay-as-you-go** อัตโนมัติ (หากตั้งค่าไว้) หรือแจ้งเตือนการอัปเกรด
- **Neural Caching**: ข้อมูลการสแกนซ้ำใน 24 ชม. จะไม่ถูกหัก Quota เพิ่ม

### 🔹 Commission Logic
- **Starter**: ค่าคอมมิชชั่นคงที่ 10% สำหรับทุกบริการ
- **Professional/Enterprise**: สามารถตั้งค่าคอมมิชชั่นแยกตามประเภทหัตถการ (Treatment-specific) ผ่าน Clinic Settings

### 🔹 Security & RLS
- ทุก Tier ได้รับการคุ้มครองข้อมูลด้วย Row Level Security (RLS) ระดับสูงสุด
- **Enterprise**: รองรับการทำ Audit Logs แบบละเอียดสำหรับ Super Admin

## 3. Commercial Structure (Estimates)

- **Starter Node**: 2,900 THB / Month
- **Professional Node**: 7,900 THB / Month
- **Enterprise Cluster**: Custom Quote (เริ่มต้น 19,000 THB / Month)

---
**สถานะแพ็กเกจ**: ✅ **ACTIVE & DEPLOYED**
**อัปเดตล่าสุด**: 31 มกราคม 2569
