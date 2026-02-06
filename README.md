# 🌟 BN-Aura: Premium Aesthetic Intelligence Suite

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/bn-aura)

**🌐 Production:** https://bn-aura.vercel.app

BN-Aura เป็นแพลตฟอร์ม Enterprise-grade สำหรับคลินิกความงามระดับ Premium ที่รวมระบบ AI Skin Analysis, 3D/AR Visualization และ CRM เข้าด้วยกัน ภายใต้สถาปัตยกรรม Multi-tenant ที่มีความปลอดภัยสูงและรองรับการขยายตัว (Scalable)

## 🚀 Key Features

- **👑 Super Admin Console**: ระบบจัดการ Global Settings, Clinics, และ Staff ในที่เดียว
- **🎨 Premium Luxury UI**: อินเทอร์เฟซที่ได้รับการออกแบบมาอย่างประณีตสำหรับลูกค้ากลุ่ม High-end
- **🔍 AI Skin Analysis & Scoring**: ระบบวิเคราะห์ผิวอัจฉริยะพร้อมการให้คะแนนแบบละเอียด
- **📈 Sales Intelligence**: Dashboard วิเคราะห์แนวโน้มยอดขาย และระบบ Lead Scoring อัตโนมัติ
- **⭐ Unified Workflow System**: ระบบ Workflow แบบครบวงจรสำหรับ Sales และ Beautician พร้อม Commission Tracking
- **🛠️ Real-time Workflow**: ระบบแจ้งเตือนและการทำงานร่วมกันระหว่างแผนก (Sales -> Beautician -> Admin) พร้อม Fallback Mechanism
- **📅 Treatment Journey Tracking**: ระบบติดตามผลการรักษาของลูกค้าแบบ Real-time เชื่อมต่อกับฐานข้อมูลจริง
- **💰 Auto-Generated Customer Codes**: ระบบสร้างรหัสลูกค้าอัตโนมัติด้วย Database Trigger
- **📊 BI Predictive Insights**: ระบบวิเคราะห์และพยากรณ์ข้อมูลทางธุรกิจด้วย AI
- **🛡️ Secure Multi-tenancy**: ระบบรักษาความปลอดภัยข้อมูลแยกตามคลินิกด้วย Supabase RLS

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) & [React Query](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm 10.x or later (recommended) or pnpm 10.x+

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Development
Run the development server:
```bash
npm run dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

### Production Build
Check for errors and create a production build:
```bash
npm run build
# or
pnpm build
```

### Deployment
Deploy to Vercel:
```bash
vercel --prod
```

## 📅 Project Status
- **Current Version**: 2.0.0 (Production - Deployed)
- **Last Updated**: 1 กุมภาพันธ์ 2569 (2026)
- **Build Status**: ✅ Passing 100% (Zero Errors/Warnings)
- **Deployment**: ✅ Live on Vercel
- **Production URL**: [bn-aura.vercel.app](https://bn-aura-lvqhywiwk-nuttapongs-projects-6ab11a57.vercel.app)

## 🆕 Latest Updates (v2.0.0)

### Unified Workflow System
- ✅ Sales Workflow Kanban Board (`/sales/workflow`)
- ✅ Beautician Task Queue (`/beautician/workflow`)
- ✅ Real-time Event Broadcasting with Fallback
- ✅ Commission Tracking System
- ✅ Auto-Generated Customer Codes

### Database Improvements
- ✅ Customer code auto-generation with triggers
- ✅ Enhanced role system (added beautician role)
- ✅ Workflow-Commission integration
- ✅ Performance optimizations with proper indexes

### Deployment & Infrastructure
- ✅ Deployed to Vercel Production
- ✅ Zero vulnerabilities in dependencies
- ✅ 100+ routes generated (SSG + Dynamic)
- ✅ Multi-language support (Thai/English)

## 📚 Documentation

Comprehensive documentation available in the `/deploy` folder:
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment procedures
- `BUILD_LOG.md` - Build process details
- `DEPLOYMENT_COMPLETE_REPORT.md` - Deployment summary
- `deployment_verification_plan.md` - Verification checklist
- `post_deployment_monitoring_plan.md` - Monitoring strategy

Implementation reports:
- `IMPLEMENTATION_COMPLETION_REPORT.md` - All fixes implemented
- `E2E_TESTING_REPORT.md` - Testing results
- `PHASE_5_COMPLETION_REPORT.md` - Security & performance fixes

---
Developed with ❤️ for the future of Aesthetic Excellence.
