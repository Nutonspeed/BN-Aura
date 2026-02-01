# 🤖 BN-Aura AI Sales Assistant - Complete Guide

**Implementation Date**: 31 มกราคม 2569  
**Status**: ✅ **Production Ready**  
**Version**: 1.0.0

---

## 📖 Overview

AI Sales Assistant เป็นระบบปัญญาประดิษฐ์ที่ช่วยเหลือเซลส์ในการขายแบบ Real-time โดยมีคำแนะนำการขาย, การจัดการข้อโต้แย้ง, และการแนะนำ Upsell อัตโนมัติ

---

## 🎯 Core Features

### 1. **AI Sales Coach** 
- แนะนำวิธีการขายตามบริบทของลูกค้า
- วิเคราะห์สถานการณ์และให้คำแนะนำแบบ Real-time
- คำนวณโอกาสปิดการขาย (Deal Probability)

### 2. **Objection Handler**
- วิเคราะห์ข้อโต้แย้งของลูกค้าอัตโนมัติ
- แนะนำวิธีตอบและแนวทางทางเลือก
- จัดประเภทข้อโต้แย้ง (price/time/trust/need)

### 3. **Upsell Recommender**
- แนะนำผลิตภัณฑ์เสริมจากผลสแกนผิว
- คำนวณ timing ที่เหมาะสมในการแนะนำ
- จัดลำดับความสำคัญ (high/medium/low)

### 4. **Lead Prioritizer**
- จัดลำดับ Leads ด้วย AI
- แจ้งเตือน Hot Leads
- แนะนำเวลาที่เหมาะสมในการติดต่อ

---

## 🛠️ Technical Architecture

### Backend Components

```
lib/ai/
├── salesCoach.ts           # AI Sales Coach Engine
├── leadPrioritizer.ts      # Lead Priority System
└── types/                  # TypeScript Types
```

### API Endpoints

```
app/api/ai/
├── sales-coach/route.ts    # POST /api/ai/sales-coach
└── lead-prioritizer/route.ts # GET/POST /api/ai/lead-prioritizer
```

### UI Components

```
components/sales/
├── AICoachPanel.tsx        # Main AI Coach Interface
├── SmartSuggestions.tsx    # Upsell Recommendations
├── HotLeadsAlert.tsx       # Hot Leads Notification
└── ...existing components
```

### Custom Hook

```
hooks/
└── useAISalesCoach.tsx     # React Hook for AI Integration
```

---

## 📋 API Reference

### 1. Sales Coach API

**Endpoint**: `POST /api/ai/sales-coach`

**Actions**:
- `get_advice` - รับคำแนะนำการขาย
- `handle_objection` - จัดการข้อโต้แย้ง  
- `get_upsell` - รับคำแนะนำ Upsell
- `calculate_probability` - คำนวณโอกาสปิดการขาย

**Example Request**:
```json
{
  "action": "get_advice",
  "context": {
    "name": "คุณสมใจ",
    "skinAnalysis": {
      "skinType": "oily",
      "concerns": ["acne", "large_pores"],
      "ageEstimate": 25,
      "urgencyScore": 75
    },
    "budget": "฿15,000-25,000"
  },
  "data": {
    "conversation": "ลูกค้าสนใจ treatment สำหรับปัญหาสิว"
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "advice": {
    "suggestion": "เน้นการใช้ผลสแกนผิวเป็นหลักฐาน",
    "talkingPoints": [
      "แสดงผลการวิเคราะห์ 468 จุด",
      "เปรียบเทียบกับข้อมูลผิวปกติ",
      "อธิบายสาเหตุของปัญหา"
    ],
    "closingTechnique": "ถาม: 'คุณพร้อมเริ่มดูแลผิวแบบมืออาชีพไหมคะ?'",
    "confidence": 85
  }
}
```

### 2. Lead Prioritizer API

**Endpoint**: `GET /api/ai/lead-prioritizer`
- รับ Hot Leads Alert

**Endpoint**: `POST /api/ai/lead-prioritizer`
- จัดลำดับ Leads, Auto-assign

---

## 💻 Usage Examples

### 1. Basic Usage with React Hook

```tsx
import { useAISalesCoach } from '@/hooks/useAISalesCoach';

function SalesInterface() {
  const { advice, loading, getAdvice } = useAISalesCoach();
  
  const customerContext = {
    name: "คุณสมใจ",
    skinAnalysis: {
      skinType: "oily",
      concerns: ["acne"],
      urgencyScore: 75
    }
  };
  
  const handleGetAdvice = async () => {
    await getAdvice(customerContext, "ลูกค้าสนใจ treatment");
  };
  
  return (
    <div>
      <button onClick={handleGetAdvice} disabled={loading}>
        {loading ? 'กำลังวิเคราะห์...' : 'รับคำแนะนำ AI'}
      </button>
      {advice && (
        <div>
          <p><strong>คำแนะนำ:</strong> {advice.suggestion}</p>
          <p><strong>ความมั่นใจ:</strong> {advice.confidence}%</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Integration in Sales Dashboard

```tsx
import AICoachPanel from '@/components/sales/AICoachPanel';

function SalesDashboard() {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [conversation, setConversation] = useState('');
  
  return (
    <div>
      {/* Main Dashboard Content */}
      
      {/* AI Coach Panel - Floating */}
      {currentCustomer && (
        <AICoachPanel 
          customerContext={currentCustomer}
          currentConversation={conversation}
          onSuggestionApply={(suggestion) => {
            setConversation(prev => prev + '\n[AI]: ' + suggestion);
          }}
        />
      )}
    </div>
  );
}
```

---

## 🧪 Testing Guide

### 1. Manual Testing

**Test Scenario 1: Basic AI Coach**
1. เปิด Sales Dashboard
2. คลิกปุ่ม "AI Coach Demo" 
3. ตรวจสอบว่า AI Coach Panel แสดงผล
4. คลิก "รับคำแนะนำใหม่"
5. ตรวจสอบว่าได้รับคำแนะนำจาก AI

**Test Scenario 2: Hot Leads Alert**
1. เปิด Sales Dashboard
2. ตรวจสอบ Hot Leads Alert ด้านบน
3. คลิกที่ Lead รายการใดรายการหนึ่ง
4. ตรวจสอบว่า AI Coach เปิดขึ้นมา

**Test Scenario 3: Upsell Recommendations**
1. เลือกลูกค้า (จาก Hot Leads หรือ Demo)
2. ตรวจสอบ Smart Suggestions Panel
3. คลิก "รับคำแนะนำ"
4. ตรวจสอบว่าได้รับคำแนะนำ Upsell

### 2. API Testing

**Test API สำหรับ Sales Coach**:
```bash
curl -X POST http://localhost:3000/api/ai/sales-coach \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_advice",
    "context": {
      "name": "Test Customer",
      "skinAnalysis": {
        "urgencyScore": 75,
        "concerns": ["acne"]
      }
    },
    "data": {
      "conversation": "Customer interested in acne treatment"
    }
  }'
```

**Expected Response**: JSON object with `advice` containing suggestion, talking points, and confidence score.

### 3. Error Handling Tests

**Test Case 1**: API ล่ม
- ปิด Gemini API key
- ตรวจสอบว่า Error Handling ทำงาน
- ตรวจสอบว่า UI แสดง fallback message

**Test Case 2**: Invalid Customer Context  
- ส่งข้อมูลลูกค้าไม่ครบ
- ตรวจสอบว่า API ส่งคืน default values

---

## 🎛️ Configuration

### Environment Variables

ต้องการ Environment Variables ต่อไปนี้:

```env
# Gemini AI
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Vercel AI Gateway (Optional)
VERCEL_AI_GATEWAY_URL=your-gateway-url

# Supabase (มีอยู่แล้ว)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Quota Management

AI Sales Assistant ใช้ระบบ Quota ที่มีอยู่แล้ว:
- ทุกการเรียกใช้ AI จะถูกหัก Quota
- `getSalesCoachAdvice`: หัก 0.2 หน่วย (Flash model)  
- `handleObjection`: หัก 0.2 หน่วย
- `getUpsellRecommendations`: หัก 0.2 หน่วย

---

## 🔧 Troubleshooting

### Common Issues

**Issue 1**: AI Coach Panel ไม่แสดง
- **Solution**: ตรวจสอบว่า `currentCustomer` state มีค่า
- **Check**: เปิด Browser DevTools ดู Console errors

**Issue 2**: API Response ช้า
- **Solution**: ตรวจสอบ Gemini API quota
- **Check**: ดู Network tab ใน DevTools

**Issue 3**: Hot Leads ไม่แสดง
- **Solution**: ตรวจสอบข้อมูลใน `lead_scoring_data` table
- **Check**: Verify RLS policies สำหรับ clinic access

### Debug Mode

เปิด Debug mode ใน development:

```javascript
// ใน useAISalesCoach.tsx
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('AI Request:', { context, conversation });
  console.log('AI Response:', result);
}
```

---

## 📈 Performance Optimization

### Caching Strategy
- ใช้ Vercel AI Gateway สำหรับ caching
- Cache ผลการสแกนซ้ำภายใน 24 ชม.
- Cache คำแนะนำที่เหมือนกันสำหรับลูกค้าเดียวกัน

### API Response Time
- **Target**: < 2 วินาที
- **Monitoring**: ใช้ Network tab เพื่อดู Response time
- **Optimization**: ใช้ Gemini Flash model สำหรับ quick responses

---

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] ทดสอบทุก API endpoints
- [ ] ตรวจสอบ Environment variables
- [ ] ทดสอบการทำงานใน production build
- [ ] ตรวจสอบ Error handling
- [ ] ทดสอบ Quota management
- [ ] Verify RLS policies
- [ ] ทดสอบบน Mobile devices

### Production Monitoring

ตรวจสอบ metrics ต่อไปนี้:
- API Response time (< 2s)
- Error rate (< 1%)
- AI Coach usage rate
- Hot Leads conversion rate
- Quota consumption rate

---

## 📞 Support & Maintenance

### Regular Maintenance

**Weekly**:
- ตรวจสอบ API performance
- Review error logs
- Monitor quota usage

**Monthly**:
- Update AI prompts based on feedback
- Optimize Lead scoring algorithm
- Review and improve UI/UX

### Contact Information

**Technical Issues**: Engineering Team  
**Feature Requests**: Product Manager  
**Bug Reports**: QA Team

---

**Document Version**: 1.0.0  
**Last Updated**: 31 มกราคม 2569  
**Next Review**: 28 กุมภาพันธ์ 2569
