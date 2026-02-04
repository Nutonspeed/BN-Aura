# Route Permission Matrix - BN-Aura Dashboard

## ปัญหาที่พบ (Critical Issues Found)

### 1. เมนูชี้ไป Path ที่ไม่มี (404 Error)
- **AR Simulator** menu → `/sales/ar-simulator` → ❌ **ไม่มี directory นี้จริง**

### 2. Route Guard vs Menu Role Conflicts 
- Route guard `/th/clinic/*` อนุญาตเฉพาะ `['clinic_owner', 'clinic_admin', 'clinic_staff']`
- แต่เมนูใน clinic namespace มี role ที่ขัดแย้ง:
  - **Point of Sale** roles = `['clinic_owner', 'clinic_admin', 'sales_staff']` → sales_staff ไม่ผ่าน guard
  - **Appointments** roles = `['clinic_owner', 'clinic_staff', 'sales_staff', 'customer']` → sales_staff, customer ไม่ผ่าน guard  
  - **Messaging Center** roles = `['clinic_owner', 'clinic_staff', 'sales_staff', 'customer']` → sales_staff, customer ไม่ผ่าน guard

### 3. Active State Logic Issue
- `pathname` จาก usePathname() = `"/th/clinic/pos"` 
- `item.href` ในเมนู = `"/clinic/pos"`
- Logic: `const isActive = pathname === item.href;` → **ไม่มีวันเท่ากัน** เพราะมี locale prefix

## เส้นทางที่มีจริงในระบบ

### Admin Routes (super_admin only)
| Route | Directory Exists | Menu Label | Current Access |
|-------|------------------|------------|----------------|
| `/admin` | ✅ | System Admin | super_admin |
| `/admin/security` | ✅ | Security Dashboard | super_admin |
| `/admin/users` | ✅ | User Management | super_admin |
| `/admin/analytics` | ✅ | Analytics & Reports | super_admin |
| `/admin/billing` | ✅ | Subscription & Billing | super_admin |
| `/admin/system` | ✅ | System Monitoring | super_admin |
| `/admin/audit` | ✅ | Audit Trail | super_admin |
| `/admin/permissions` | ✅ | Permissions & Roles | super_admin |
| `/admin/support` | ✅ | Support Tickets | super_admin |
| `/admin/settings` | ✅ | Global Settings | super_admin |
| `/admin/broadcast` | ✅ | Broadcast Messaging | super_admin |
| `/admin/announcements` | ✅ | Announcements | super_admin |
| `/admin/clinics` | ✅ | (ไม่อยู่ในเมนู) | super_admin |
| `/admin/clinics/[id]` | ✅ | (ไม่อยู่ในเมนู) | super_admin |
| `/admin/network-map` | ✅ | (ไม่อยู่ในเมนู) | super_admin |

### Clinic Routes
| Route | Directory Exists | Menu Label | Current Menu Roles | Route Guard |
|-------|------------------|------------|-------------------|-------------|
| `/clinic` | ✅ | Clinic Overview | clinic_owner, clinic_admin | ✅ Match |
| `/clinic/pos` | ✅ | Point of Sale (POS) | clinic_owner, clinic_admin, **sales_staff** | ❌ **Conflict** |
| `/clinic/pos/history` | ✅ | (sub-route) | - | ❌ **Conflict** |
| `/clinic/appointments` | ✅ | Appointments | clinic_owner, clinic_staff, **sales_staff, customer** | ❌ **Conflict** |
| `/clinic/staff` | ✅ | Staff Management | clinic_owner, clinic_admin | ✅ Match |
| `/clinic/branches` | ✅ | Branches | clinic_owner, clinic_admin | ✅ Match |
| `/clinic/inventory` | ✅ | Inventory Control | clinic_owner, clinic_admin, clinic_staff | ✅ Match |
| `/clinic/inventory/orders` | ✅ | (sub-route) | - | ✅ Match |
| `/clinic/inventory/suppliers` | ✅ | (sub-route) | - | ✅ Match |
| `/clinic/treatments` | ✅ | Treatments & Protocol | clinic_owner, clinic_staff | ✅ Match |
| `/clinic/revenue` | ✅ | Revenue & Sales | clinic_owner, clinic_admin | ✅ Match |
| `/clinic/reports` | ✅ | Business Reports | clinic_owner, clinic_admin | ✅ Match |
| `/clinic/quota` | ✅ | AI Quota | clinic_owner, clinic_admin | ✅ Match |
| `/clinic/chat` | ✅ | Messaging Center | clinic_owner, clinic_staff, **sales_staff, customer** | ❌ **Conflict** |
| `/clinic/settings` | ✅ | Clinic Settings | clinic_owner | ✅ Match |
| `/clinic/customers` | ✅ | (ไม่อยู่ในเมนู) | - | - |
| `/clinic/customers/[id]` | ✅ | (ไม่อยู่ในเมนู) | - | - |

### Sales Routes (sales_staff only)
| Route | Directory Exists | Menu Label | Current Access |
|-------|------------------|------------|----------------|
| `/sales` | ✅ | Sales Intelligence | sales_staff |
| `/sales/analysis` | ✅ | AI Skin Analysis | sales_staff |
| `/sales/ar-simulator` | ❌ **Missing** | AR Simulator | sales_staff |
| `/sales/analytics` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/customers` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/customers/[id]` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/customers/create` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/leads` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/proposals` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/proposals/create` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |
| `/sales/workflow` | ✅ | (ไม่อยู่ในเมนู) | sales_staff |

### Beautician Routes (clinic_staff only)  
| Route | Directory Exists | Menu Label | Current Access |
|-------|------------------|------------|----------------|
| `/beautician` | ✅ | Clinical Node | clinic_staff |
| `/beautician/workflow` | ✅ | (ไม่อยู่ในเมนู) | clinic_staff |

### Customer Routes
| Route | Directory Exists | Menu Label | Current Menu Roles | Route Guard |
|-------|------------------|------------|-------------------|-------------|
| `/customer` | ✅ | My Skin Portal | **customer only** | customer, premium_customer, free_customer |
| `/customer/booking` | ✅ | (ไม่อยู่ในเมนู) | - | ✅ Match |
| `/customer/loyalty` | ✅ | (ไม่อยู่ในเมนู) | - | ✅ Match |
| `/customer/rewards` | ✅ | (ไม่อยู่ในเมนู) | - | ✅ Match |
| `/customer/skin-profile` | ✅ | (ไม่อยู่ในเมนู) | - | ✅ Match |

### Other Routes
| Route | Directory Exists | Menu Label | Notes |
|-------|------------------|------------|-------|
| `/analytics` | ✅ | (ไม่อยู่ในเมนู) | ไม่ชัดเจน role/access |

## แผนการแก้ไข (Fix Strategy)

### Priority 1: แก้ไข Route Guard Conflicts
**ตัวเลือก A (แนะนำ): ปรับ Route Guard ให้ยืดหยุ่น**
```typescript
// แทน clinic/* block ทั้งหมด ให้เฉพาะบาง path
if (pathname.startsWith('/th/clinic')) {
  // Allow shared routes
  const sharedRoutes = ['/th/clinic/pos', '/th/clinic/appointments', '/th/clinic/chat'];
  if (sharedRoutes.some(route => pathname.startsWith(route))) {
    const allowedRoles = ['clinic_owner', 'clinic_admin', 'clinic_staff', 'sales_staff'];
    if (pathname.startsWith('/th/clinic/appointments') || pathname.startsWith('/th/clinic/chat')) {
      allowedRoles.push('customer', 'premium_customer', 'free_customer');
    }
    if (!allowedRoles.includes(userRole)) {
      router.push('/th/login');
      return;
    }
  } else {
    // Restricted clinic routes
    if (!['clinic_owner', 'clinic_admin', 'clinic_staff'].includes(userRole)) {
      router.push('/th/login'); 
      return;
    }
  }
}
```

**ตัวเลือก B: สร้าง Shared Namespace**
- ย้าย `/clinic/pos`, `/clinic/appointments`, `/clinic/chat` ไปเป็น `/shared/*` 
- ปรับเมนูและลิงก์ทั้งหมด

### Priority 2: แก้ไข Active State Logic
```typescript
// แทน: const isActive = pathname === item.href;
const isActive = pathname === `/th${item.href}` || pathname.startsWith(`/th${item.href}/`);
```

### Priority 3: แก้ไขเมนูที่ชี้ไป 404
**ตัวเลือก A: สร้างหน้า `/sales/ar-simulator`**
**ตัวเลือก B: ลบเมนู AR Simulator ออก**

### Priority 4: ปรับ Customer Menu Roles
```typescript
// เพิ่ม premium_customer, free_customer ให้กับ My Skin Portal
{ icon: LayoutDashboard, label: 'My Skin Portal', href: '/customer', roles: ['customer', 'premium_customer', 'free_customer'] },
```

## Business Rules Validation

### Data Isolation Requirements ✅
- **Sales staff** เห็นเฉพาะลูกค้าที่ assign ให้ตนเอง
- **Clinic owner/admin** เห็นข้อมูลทั้งคลินิก  
- **Customer** เห็นเฉพาะข้อมูลตนเอง
- **Chat isolation** ลูกค้าแชทได้เฉพาะกับ sales ของตนเอง

### Route Access Alignment
- ✅ Admin routes: เฉพาะ super_admin
- ⚠️ Shared business routes: ต้องแก้ guard ให้รองรับ cross-role access  
- ✅ Role-specific dashboards: แยกชัดเจน
- ⚠️ Customer menu: ต้องรองรับ customer variants ทั้งหมด
