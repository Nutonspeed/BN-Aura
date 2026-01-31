# 📋 BN-Aura: Business Logic & Seed Data (Production v2.0)

ข้อมูลเริ่มต้นสำหรับการตั้งค่าระบบและทดสอบ E2E เพื่อให้ครอบคลุม Workflow การขายและหัตถการจริง

## 1. Roles & Permissions Mapping (RBAC 2.0)

| Role | Operational Scope | Entry Point |
|------|------------------|-------------|
| `super_admin` | Global node monitoring & clinic approval | `/admin` |
| `clinic_owner` | Executive BI & Strategic forecasting | `/clinic` |
| `sales_staff` | Magic Scan, CRM & Digital Proposals | `/sales` |
| `clinic_staff` | Beautician tasks & Protocol execution | `/beautician` |
| `customer` | Elite Portal & Skin Journey tracking | `/customer` |

## 2. Advanced Treatment & Pricing Seed
ข้อมูลสำหรับตาราง `clinic_treatment_pricing` เพื่อทดสอบระบบคำนวณคอมมิชชั่น:

```sql
INSERT INTO public.clinic_treatment_pricing (treatment_name, base_price, sales_commission_rate)
VALUES 
('HydraFacial Premium', 4500, 15.00),
('Pico Rejuvenation', 8500, 12.50),
('Ulthera Full Face', 45000, 10.00),
('Vitamin C Infusion', 2500, 20.00);
```

## 3. Workflow Intelligence Logic
- **Initialization**: ทันทีที่สแกนเสร็จ ระบบสร้าง `customer_treatment_journeys` สถานะ `consultation`
- **Handover**: เมื่อฝ่ายขายส่งแผนการรักษา ระบบเปลี่ยนสถานะเป็น `treatment_planned` และส่งงานเข้า `task_queue`
- **Execution**: พนักงานหัตถการเริ่มงาน เปลี่ยนสถานะเป็น `in_progress` และแจ้งเตือนฝ่ายขายแบบ Real-time
- **Completion**: เมื่อจบหัตถการ ระบบเปลี่ยนสถานะเป็น `completed` และส่ง Care Instructions ให้ลูกค้าผ่านแชท

## 4. AI Strategic Thresholds
- **Lead Scoring**: 
  - Scan Matrix Completeness: 40%
  - Intent to Purchase (via Chat): 30%
  - Budget/Pricing Alignment: 30%
- **Quota Warnings**: แจ้งเตือนระดับระบบ (Super Admin) เมื่อ Load รวมเกิน 85% และแจ้งรายคลินิกเมื่อเหลือ < 10%

---
**สถานะข้อมูล**: ✅ **READY FOR SEEDING**
**อัปเดตล่าสุด**: 31 มกราคม 2569
