# 🎯 ClinicIQ: Project Blueprint (Aesthetic Intelligence Suite)

## 1. Vision & Objective
ClinicIQ เป็นแพลตฟอร์ม Enterprise-grade สำหรับคลินิกความงามระดับ Premium ที่รวมระบบ AI Skin Analysis, 3D/AR Visualization และ CRM เข้าด้วยกัน ภายใต้สถาปัตยกรรม Multi-tenant ที่เน้นความปลอดภัยของข้อมูลสูงสุด (RLS) และประสบการณ์ผู้ใช้ที่หรูหรา (Premium Aesthetic)

## 2. Technology Stack (Core)

### Frontend & Framework
- **Framework**: Next.js 15.1.x (App Router)
- **Library**: React 19.0.x
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 12.23
- **Icons**: Lucide React
- **Components**: shadcn/ui + Radix UI

### Backend & Database
- **Platform**: Supabase
- **Database**: PostgreSQL (96+ tables)
- **Auth**: Supabase Auth (JWT + Custom Claims)
- **Security**: Strict Row Level Security (RLS)

### AI & Computer Vision
- **Face Detection**: MediaPipe (468-point landmarks)
- **ML Engine**: TensorFlow.js
- **Vision API**: Google Cloud Vision
- **LLM**: Google Gemini 1.5 (Pro & Flash)

### Tools & Deployment
- **Package Manager**: pnpm 10.12.0
- **Deployment**: Vercel (Production ready)
- **Monitoring**: Sentry + OpenTelemetry

## 3. High-Level Architecture

### Multi-tenancy
- ระบบถูกออกแบบให้รองรับหลายร้อยคลินิกใน Database เดียว
- ข้อมูลถูกแยกโดย `clinic_id` และป้องกันด้วย RLS
- รองรับการตั้งค่า Quota และ Subscription แยกตามคลินิก

### Role-Based Access Control (RBAC)
1. **Super Admin**: จัดการคลินิกทั้งหมด, ดู Telemetry, จัดการ Billing
2. **Clinic Owner**: เจ้าของคลินิก, จัดการ Staff, ดู Analytics การเงิน
3. **Clinic Admin/Manager**: จัดการสาขา, ตารางงาน, การตั้งค่าคลินิก
4. **Sales Staff**: จัดการ Leads, ทำ Presentation, วิเคราะห์ผิวลูกค้า
5. **Customer**: ดูผลวิเคราะห์ของตนเอง, จองคิว, แชทกับคลินิก

### Internationalization (i18n)
- รองรับ 2 ภาษาหลัก: ไทย (Default), อังกฤษ
- ใช้ `next-intl` ในการจัดการคำแปล
- โครงสร้าง JSON messages แยกตาม namespace

## 4. Key Performance Invariants
- **Build Time**: ต้องต่ำกว่า 6 นาที (ใช้ FAST_BUILD mode)
- **UI Performance**: 60 FPS animations
- **Reliability**: Zero technical debt on Type-check และ Linting
- **Security**: ข้อมูลข้ามคลินิกต้องไม่รั่วไหล 100%
