# 🎨 BN-Aura: Frontend Architecture & UI/UX Spec (Production v2.0)

## 1. Design Philosophy: "Premium Medical AI"
- **Color Palette**: 
  - Main: Midnight Navy (`#050505`) - พื้นหลังเน้นความลึกและมีมิติ
  - Accent: Blue/Cyan/Emerald Gradients (`primary`, `emerald` ใน tailwind config)
  - Glassmorphism: `glass-premium` (การผสมผสานระหว่างความใสและเบลอระดับสูง)
- **Typography**: 
  - Thai: **IBM Plex Sans Thai** (Body/UI), **Anuphan** (Display/Headings)
  - English: **Inter** (Technical/Numbers)
- **Visual Effects**: 
  - **Aura Glow**: เอฟเฟกต์แสงเรืองรอบคอมโพเนนต์สำคัญ
  - **Luxury Motion**: ใช้ `Framer Motion` สำหรับการเคลื่อนไหวที่นุ่มนวลและมีระดับ
  - **Grain Texture**: พื้นผิวละเอียดเพิ่มความรู้สึก Enterprise-grade

## 2. Directory Structure (Next.js 15 App Router)
```
/app
├── layout.tsx          # Root layout (Fonts, SEO, PDPA Modal)
├── [locale]
│   ├── layout.tsx      # Locale Provider, Auth Provider
│   ├── page.tsx        # Luxury Marketing Landing Page
│   ├── /(auth)         # Secure Login Flow
│   ├── /(dashboard)    # Unified Dashboard Hub
│   │   ├── layout.tsx  # Sidebar Drawer & Top Header
│   │   ├── /admin      # Super Admin Global Console
│   │   ├── /clinic     # Executive Intelligence & Operations
│   │   ├── /sales      # Sales Intelligence & Magic Scan
│   │   ├── /beautician # Clinical Node & Protocol Registry
│   │   └── /customer   # Elite Member Portal & Journey
│   └── /analysis       # Legacy Redirect to Sales Intelligence
```

## 3. Component Architecture
- **/components/ui**: คอมโพเนนต์พื้นฐานที่ได้รับการปรับแต่งให้เป็น Glassmorphism
- **/components/sales**: เครื่องมือเฉพาะทาง เช่น `CommissionTracker`, `ChatCenter`
- **/components/analytics**: ระบบ Visualisation เช่น `RevenueChart`, `StrategicForecast`
- **/components/customer**: ระบบติดตาม เช่น `TreatmentJourney`, `MySalesRep`
- **/components/beautician**: ระบบปฏิบัติการ เช่น `TaskQueue`, `ProtocolInsights`

## 4. Animation Strategy (Framer Motion)
- **Spring Physics**: ใช้ค่า Stiffness/Damping เพื่อความรู้สึกที่เป็นธรรมชาติ
- **AnimatePresence**: จัดการการเปลี่ยนสถานะของ UI (เช่น การเปลี่ยน Step ใน Magic Scan)
- **Layout Animations**: ใช้ `layout` prop เพื่อให้ UI ปรับขนาดอย่างนุ่มนวล
- **Staggered Entrance**: การปรากฏของข้อมูลใน Grid แบบเรียงลำดับ

---
**สถานะเอกสาร**: ✅ **LATEST & VERIFIED**
**อัปเดตล่าสุด**: 31 มกราคม 2569
