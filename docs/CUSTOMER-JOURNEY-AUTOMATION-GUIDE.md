# Customer Journey Automation System
## Phase 9: Complete Implementation Guide

### 📋 **Overview**

BN-Aura Customer Journey Automation System ประกอบด้วย 3 ส่วนหลัก:

1. **Automated Follow-up System** - ติดตามลูกค้าอัตโนมัติด้วย AI
2. **Loyalty & Gamification System** - ระบบสะสมแต้มและ Achievement
3. **Customer Portal Integration** - หน้า Dashboard สำหรับลูกค้า

---

## 🎯 **Phase 9.1: Automated Follow-up System**

### **Core Components**

#### **📁 lib/customer/followUpAutomation.ts**
- **FollowUpAutomationEngine** - Engine หลักสำหรับ Follow-up
- **FollowUpRule** - กฎการติดตามลูกค้า
- **FollowUpExecution** - การดำเนินการติดตาม

#### **📊 Database Tables**
```sql
-- ใน migration: 20250202_followup_system.sql
- followup_rules          -- กฎการ follow-up
- followup_executions     -- ประวัติการส่ง follow-up
- customer_preferences    -- การตั้งค่าของลูกค้า
- followup_templates      -- Template สำเร็จรูป
- customer_journey_events -- การติดตามพฤติกรรมลูกค้า
```

### **Key Features**

#### **🤖 AI Personalization**
```typescript
// สร้างข้อความ personalized ด้วย AI
const personalizedContent = await generatePersonalizedContent(rule, customer);

// ตัวอย่างข้อความที่ AI สร้าง:
"สวัสดีค่ะคุณ[ชื่อ] หลังจาก HydraFacial เมื่อวาน 
ผิวของคุณเป็นยังไงบ้างคะ? หากมีคำถามเกี่ยวกับ 
การดูแลหลัง Treatment สามารถสอบถามได้ตลอดเวลา ☺️"
```

#### **📅 Smart Scheduling**
- คำนวณเวลาส่งตาม Customer Preferences
- ปรับตามโซนเวลา (Asia/Bangkok)
- หลีกเลี่ยงเวลาไม่เหมาะสม

#### **📊 Multi-Channel Support**
- **Email** - ข้อความยาว พร้อม HTML formatting
- **SMS** - ข้อความสั้น กระชับ
- **LINE** - Sticker และ Rich Menu
- **In-App** - Notification ในแอป
- **Call** - สร้าง Task สำหรับ Staff โทรติดตาม

### **Follow-up Types**

| Type | Trigger | Channel | AI Personalization |
|------|---------|---------|-------------------|
| **post_treatment** | หลัง Treatment 24 ชั่วโมง | All | ✅ |
| **payment_reminder** | ก่อนครบกำหนด 3 วัน | SMS, Email | ✅ |
| **appointment_reminder** | ก่อนนัด 24 ชั่วโมง | SMS, LINE | ❌ |
| **satisfaction_survey** | หลัง Treatment 7 วัน | Email, In-App | ✅ |
| **upsell_opportunity** | หลัง Treatment 14 วัน | All | ✅ |
| **birthday_special** | วันเกิด | All | ✅ |
| **inactive_reactivation** | ไม่มากาน 60 วัน | Email, SMS | ✅ |

### **Usage Examples**

#### **สร้าง Follow-up Rule**
```typescript
import { followUpEngine } from '@/lib/customer/followUpAutomation';

// สร้าง Rule ติดตามหลัง Treatment
const rule = await followUpEngine.createFollowUpRule({
  clinicId: 'clinic-id',
  name: 'Post HydraFacial Follow-up',
  type: 'post_treatment',
  triggerConditions: {
    daysAfter: 1,
    treatmentType: ['hydrafacial']
  },
  channels: ['sms', 'line'],
  priority: 'high',
  active: true,
  aiPersonalization: true,
  template: {
    subject: 'ติดตามหลัง Treatment',
    message: 'สวัสดีค่ะ {customerName} รู้สึกยังไงบ้างหลัง Treatment เมื่อวาน?',
    variables: ['customerName']
  }
});
```

#### **Execute Scheduled Follow-ups**
```typescript
// รันทุก 15 นาที via Cron Job
const executedCount = await followUpEngine.executeScheduledFollowUps();
console.log(`Executed ${executedCount} follow-ups`);
```

---

## 🏆 **Phase 9.2: Loyalty & Gamification System**

### **Core Components**

#### **📁 lib/customer/loyaltySystem.ts**
- **LoyaltySystemEngine** - Engine หลัก
- **LoyaltyProfile** - ข้อมูลสมาชิก
- **Achievement** - รางวัลและความสำเร็จ
- **PointTransaction** - ประวัติการใช้แต้ม

### **Loyalty Tiers**

| Tier | Points Required | Benefits | Icon |
|------|----------------|----------|------|
| **Bronze** | 0 | ส่วนลด 5%, แต้ม 1x | 🥉 |
| **Silver** | 1,000 | ส่วนลด 8%, แต้ม 1.5x | 🥈 |
| **Gold** | 3,000 | ส่วนลด 10%, แต้ม 2x | 🥇 |
| **Platinum** | 7,000 | ส่วนลด 12%, แต้ม 2.5x | 💎 |
| **Diamond** | 15,000 | ส่วนลด 15%, แต้ม 3x | 💠 |

### **Achievement Categories**

#### **🛍️ Spending Achievements**
- **First Purchase** (100 points) - การซื้อครั้งแรก
- **Big Spender** (300 points) - ใช้จ่าย ฿10,000+
- **VIP Member** (500 points) - ใช้จ่าย ฿50,000+

#### **📅 Frequency Achievements**
- **Regular Customer** (200 points) - มา 5 ครั้งใน 3 เดือน
- **Loyal Customer** (400 points) - มา 12 ครั้งใน 1 ปี
- **VIP Regular** (600 points) - มาทุกเดือนติดต่อกัน 6 เดือน

#### **👥 Referral Achievements**
- **Friend Bringer** (150 points) - แนะนำเพื่อน 1 คน
- **Ambassador** (500 points) - แนะนำเพื่อน 5 คน
- **Influencer** (1000 points) - แนะนำเพื่อน 10 คน

### **Point System**

#### **การได้รับแต้ม**
- **Treatment** - 1 แต้มต่อ ฿10 ที่ใช้จ่าย
- **Review** - 50 แต้มต่อรีวิว
- **Referral** - 200 แต้มต่อเพื่อนที่มาใช้บริการ
- **Birthday** - 100 แต้มในเดือนเกิด
- **Check-in** - 10 แต้มต่อการเช็คอิน

#### **การใช้แต้ม**
- **ส่วนลด 5%** - 500 แต้ม
- **ส่วนลด 10%** - 1,000 แต้ม
- **ฟรี Basic Facial** - 1,500 แต้ม
- **ฟรี Premium Mask** - 800 แต้ม

### **Usage Examples**

#### **สร้าง Loyalty Profile**
```typescript
import { loyaltySystem } from '@/lib/customer/loyaltySystem';

const profile = await loyaltySystem.createLoyaltyProfile(
  'customer-id', 
  'clinic-id'
);
// ได้รับแต้มเริ่มต้น 100 แต้ม
```

#### **มอบแต้มให้ลูกค้า**
```typescript
// มอบแต้มหลัง Treatment
await loyaltySystem.awardPoints(
  'customer-id',
  'clinic-id', 
  150,
  'HydraFacial Treatment',
  'earned',
  'workflow-id'
);

// ระบบจะ:
// - เพิ่มแต้มให้ลูกค้า
// - ตรวจสอบ Tier upgrade
// - ตรวจสอบ Achievement unlock
// - ส่ง Notification
```

#### **แลกรางวัล**
```typescript
const result = await loyaltySystem.redeemReward(
  'customer-id',
  'clinic-id',
  'reward-id'
);

if (result.success) {
  console.log('แลกรางวัลสำเร็จ!');
} else {
  console.log('Error:', result.message);
}
```

---

## 💻 **Phase 9.3: Customer Portal Integration**

### **Core Components**

#### **📁 components/customer/LoyaltyDashboard.tsx**
- **Real-time Loyalty Status** - แสดงแต้ม, Tier, Progress
- **Achievement Gallery** - แสดง Achievement ที่ปลดล็อกแล้ว
- **Transaction History** - ประวัติการใช้แต้ม
- **Referral Center** - ระบบแนะนำเพื่อน
- **Quick Actions** - การกระทำด่วน

### **Dashboard Features**

#### **🎨 Tier Visualization**
- **Progress Bar** แสดงความคืบหน้าไป Tier ถัดไป
- **Benefits Comparison** เปรียบเทียบสิทธิ์แต่ละ Tier
- **Tier Upgrade Animation** เมื่อเลื่อนระดับ

#### **🏆 Achievement System**
- **Unlocked Achievements** แสดงความสำเร็จที่ได้แล้ว
- **Progress Tracking** ติดตามความคืบหน้า Achievement
- **Secret Achievements** Achievement ลับที่ซ่อนอยู่

#### **📊 Analytics & Insights**
- **Spending Pattern** รูปแบบการใช้จ่าย
- **Visit Frequency** ความถี่ในการมาใช้บริการ
- **Favorite Treatments** Treatment ที่ชื่นชอบ

### **Mobile Responsive Design**
- ออกแบบให้ใช้งานบนมือถือได้สะดวก
- Touch-friendly interface
- Progressive Web App (PWA) ready

---

## 🔧 **Technical Implementation**

### **Database Schema**

#### **Loyalty System Tables**
```sql
-- Loyalty Profiles
CREATE TABLE loyalty_profiles (
  customer_id VARCHAR(255) PRIMARY KEY,
  clinic_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  current_tier VARCHAR(20) DEFAULT 'bronze',
  tier_progress DECIMAL(5,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  referral_code VARCHAR(10) UNIQUE NOT NULL
);

-- Point Transactions
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'earned', 'redeemed', 'expired'
  amount INTEGER NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL,
  conditions JSONB NOT NULL,
  points_reward INTEGER DEFAULT 0,
  badge_icon VARCHAR(10)
);
```

### **API Endpoints**

#### **Loyalty System APIs**
```typescript
// Get loyalty profile
GET /api/loyalty/profile?customerId={id}

// Award points
POST /api/loyalty/points/award
{
  "customerId": "customer-id",
  "points": 150,
  "description": "HydraFacial Treatment"
}

// Redeem reward
POST /api/loyalty/rewards/redeem
{
  "customerId": "customer-id", 
  "rewardId": "reward-id"
}
```

#### **Follow-up System APIs**
```typescript
// Create follow-up rule
POST /api/followup/rules
{
  "name": "Post Treatment Follow-up",
  "type": "post_treatment",
  "triggerConditions": { "daysAfter": 1 },
  "channels": ["sms", "email"]
}

// Execute scheduled follow-ups
POST /api/followup/execute

// Track response
POST /api/followup/track-response
{
  "executionId": "execution-id",
  "response": {
    "opened": true,
    "sentiment": "positive"
  }
}
```

---

## 🚀 **Deployment Guide**

### **1. Database Setup**
```bash
# Run migrations
supabase migration up

# ตรวจสอบ tables
supabase db seed
```

### **2. Environment Variables**
```env
# AI Configuration
GOOGLE_GEMINI_API_KEY=your-gemini-key
VERCEL_AI_GATEWAY_URL=your-gateway-url

# Email/SMS Configuration
EMAIL_PROVIDER_API_KEY=your-email-key
SMS_PROVIDER_API_KEY=your-sms-key
LINE_BOT_TOKEN=your-line-token

# Loyalty System
LOYALTY_POINTS_PER_BAHT=0.1
REFERRAL_BONUS_POINTS=200
```

### **3. Cron Jobs Setup**
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-followups",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/expire-points", 
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 📊 **Analytics & Reporting**

### **Follow-up Analytics**
- **Delivery Rate** - อัตราการส่งสำเร็จ
- **Open Rate** - อัตราการเปิดอ่าน
- **Click Rate** - อัตราการคลิกลิงก์
- **Response Rate** - อัตราการตอบกลับ
- **Channel Performance** - ประสิทธิภาพแต่ละช่องทาง

### **Loyalty Analytics**  
- **Tier Distribution** - การแจกแจงสมาชิกแต่ละ Tier
- **Point Velocity** - ความเร็วในการสะสมแต้ม
- **Redemption Rate** - อัตราการแลกรางวัล
- **Achievement Unlock Rate** - อัตราการปลดล็อก Achievement

### **Customer Journey Analytics**
- **Lifecycle Stage** - ระยะของ Customer Lifecycle
- **Engagement Score** - คะแนนความมีส่วนร่วม  
- **Churn Prediction** - การทำนายลูกค้าจะหยุดใช้บริการ
- **LTV Calculation** - คำนวณ Customer Lifetime Value

---

## 🔒 **Security & Privacy**

### **Data Protection**
- **PDPA Compliance** - ปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
- **Consent Management** - จัดการความยินยอม
- **Data Encryption** - เข้ารหัสข้อมูลสำคัญ
- **Audit Trail** - บันทึกการเข้าถึงข้อมูล

### **Communication Security**
- **Opt-out Mechanism** - ระบบยกเลิกการรับข้อมูล
- **Rate Limiting** - จำกัดการส่งข้อความ
- **Anti-Spam** - ป้องกันการส่งข้อความรบกวน

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// loyalty-system.test.ts
describe('LoyaltySystem', () => {
  test('should award points correctly', async () => {
    await loyaltySystem.awardPoints('customer-1', 'clinic-1', 100, 'test');
    const profile = await loyaltySystem.getLoyaltyProfile('customer-1', 'clinic-1');
    expect(profile?.availablePoints).toBe(100);
  });
});
```

### **Integration Tests**
- ทดสอบ API endpoints
- ทดสอบการทำงานร่วมกับ Workflow System
- ทดสอบ Real-time notifications

### **E2E Tests**
- ทดสอบ Customer Journey สมบูรณ์
- ทดสอบ Follow-up automation
- ทดสอบ Loyalty dashboard UI

---

## 🔮 **Future Enhancements**

### **Phase 10: Advanced AI Features**
- **Predictive Analytics** - ทำนายพฤติกรรมลูกค้า
- **Dynamic Pricing** - ปรับราคาตามความต้องการ
- **Personalized Recommendations** - แนะนำ Treatment แบบ AI

### **Phase 11: Omnichannel Experience**
- **Social Media Integration** - เชื่อมต่อ Facebook, Instagram
- **Voice Assistant** - สั่งงานด้วยเสียง
- **AR/VR Experience** - ประสบการณ์ความจริงเสริม

### **Phase 12: Advanced Analytics**
- **Customer Segmentation** - จัดกลุ่มลูกค้าอัตโนมัติ
- **Cohort Analysis** - วิเคราะห์กลุ่มลูกค้า
- **A/B Testing Platform** - ทดสอบการตลาดแบบ A/B

---

## ✅ **Checklist: Go-Live Readiness**

### **Technical Setup**
- [ ] Database migrations executed
- [ ] API endpoints tested
- [ ] Cron jobs configured
- [ ] Environment variables set
- [ ] Email/SMS providers configured

### **Content Setup** 
- [ ] Follow-up templates created
- [ ] Achievement definitions added
- [ ] Loyalty rewards configured
- [ ] Customer preferences defaults set

### **Testing**
- [ ] Unit tests passing
- [ ] Integration tests passing  
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security audit completed

### **Compliance**
- [ ] PDPA consent forms ready
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Data retention policy defined

---

## 📞 **Support & Troubleshooting**

### **Common Issues**

#### **Follow-ups not sending**
```bash
# Check cron job status
vercel logs --filter="cron"

# Check failed executions
SELECT * FROM followup_executions 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

#### **Points not updating**
```bash
# Check point transactions
SELECT * FROM point_transactions 
WHERE customer_id = 'customer-id' 
ORDER BY created_at DESC;

# Recalculate points
UPDATE loyalty_profiles 
SET available_points = (
  SELECT SUM(amount) FROM point_transactions 
  WHERE customer_id = loyalty_profiles.customer_id
);
```

### **Performance Optimization**
- **Database Indexing** - เพิ่ม index สำหรับ queries ที่ใช้บ่อย
- **Caching** - ใช้ Redis cache สำหรับข้อมูลที่เข้าถึงบ่อย
- **Background Jobs** - ย้าย heavy operations ไป background

---

**🎉 Customer Journey Automation System พร้อมใช้งานแล้ว!**

ระบบนี้จะช่วยให้คลินิกสามารถ:
- **เพิ่มความผูกพันกับลูกค้า** ด้วย Follow-up อัตโนมัติ
- **สร้างความภักดี** ด้วยระบบ Loyalty และ Gamification  
- **ปรับปรุงประสบการณ์ลูกค้า** ด้วย Customer Portal ที่ครบครัน

สำหรับการใช้งานและการพัฒนาต่อยอด สามารถดูรายละเอียดเพิ่มเติมได้ในเอกสารแต่ละส่วน
