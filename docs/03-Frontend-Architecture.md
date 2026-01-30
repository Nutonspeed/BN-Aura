# 🎨 Frontend Architecture & UI/UX Spec

## 1. Design Philosophy: "Premium Medical AI"
- **Color Palette**: 
  - Main: Midnight Navy (`#020617`) - ตั้งค่าใน `hsl(var(--background))`
  - Accent: Blue/Cyan Gradients (`primary`, `secondary` ใน tailwind config)
  - Glassmorphism: `glass-white` (`rgba(255, 255, 255, 0.03)`) และ `glass-border`
- **Typography**: 
  - Thai: **Noto Sans Thai** (Body), **Kanit** (Display/Headings)
  - English: Inter (Fallback)
  - กำหนดผ่าน CSS Variables: `--font-noto-thai` และ `--font-kanit`
- **Visual Effects**: 
  - **Ambient Glow**: `glow-pulse` animation
  - **Cinematic Shadows**: `shadow-premium` (0 4px 20px -5px rgba(0, 0, 0, 0.1))
  - **Grain Effect**: `animate-grain` สำหรับ Texture พื้นหลังที่ดูพรีเมียม
  - **Smooth Transitions**: ใช้ `Framer Motion` ผ่าน `PageTransition` component

## 2. Directory Structure (App Router)
```
/app
├── layout.tsx          # Root layout (Providers, Fonts, SEO)
├── [locale]
│   ├── layout.tsx      # Locale-specific layout (Intl, SmoothScroll)
│   ├── page.tsx        # Landing Page
│   ├── /(auth)         # Authentication flows
│   ├── /(dashboard)    # Role-based dashboards
│   │   ├── /clinic     # Clinic Owner/Admin views
│   │   ├── /sales      # Sales Staff tools
│   │   ├── /customer   # Customer profile & results
│   │   └── /super-admin# System-wide management
│   ├── /analysis       # AI Skin Scan interface
│   └── /ar-simulator   # 3D/AR Face simulation
```

## 3. Core Design Patterns
- **Glass Card**: 
  ```tsx
  className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-premium"
  ```
- **Pulsing Glow**: ใช้สำหรับจุดที่ต้องการดึงดูดสายตา (เช่น AI Scanning)
  ```tsx
  className="animate-glow-pulse bg-primary/20"
  ```
- **Responsive Handling**: 
  - Mobile: เน้นการใช้งานมือเดียว (Bottom sheets, Large tap targets)
  - Desktop: Sidebar navigation พร้อม Glassmorphism effect

## 4. Global State & Layout
- **Middleware**: จัดการ i18n และ Auth Redirects (รองรับการ Refresh Session อัตโนมัติ)
- **Smooth Scroll**: ใช้ `lenis` หรือ Custom implementation เพื่อความรู้สึกลื่นไหล
- **IntlProvider**: จัดการคำแปล TH/EN แบบ Client-side

## 5. Animation Strategy
- **Entry**: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- **Hover**: Scale เล็กน้อย (1.02) และเพิ่มความสว่าง (Brightness)
- **Loading**: Skeleton screens ที่มี Pulsing effect สีเทาเข้ม
