# 📱 SMS Setup Guide - ThaiBulkSMS

**Provider**: ThaiBulkSMS (thaibulksms.com)  
**Status**: ✅ Configured and Ready

---

## 🔑 API Credentials

**App Name**: `bn-aura`  
**API Key**: `dzYeWe50jWC1Su13QJHRChSxLD_hzi`  
**API Secret**: `-csdra52KjZlgEMEe-x8AfQsk6_mRQ`

**⚠️ Keep these credentials secure! Do not commit to Git.**

---

## ⚙️ Environment Setup

### **1. Copy to `.env.local`**

```bash
# SMS Configuration
THAI_SMS_PLUS_API_KEY=dzYeWe50jWC1Su13QJHRChSxLD_hzi
THAI_SMS_PLUS_SECRET=-csdra52KjZlgEMEe-x8AfQsk6_mRQ
SMS_SENDER_NAME=bn-aura
```

### **2. For Production (Vercel)**

Go to Vercel Dashboard → Settings → Environment Variables:

```
THAI_SMS_PLUS_API_KEY = dzYeWe50jWC1Su13QJHRChSxLD_hzi
THAI_SMS_PLUS_SECRET = -csdra52KjZlgEMEe-x8AfQsk6_mRQ
SMS_SENDER_NAME = bn-aura
```

---

## 🎯 Webhook Configuration

**Webhook URL**: 
```
https://bn-aura.vercel.app/api/webhooks/sms
```

**Method**: GET  
**Purpose**: Receive delivery reports and status updates

### **Setup in ThaiBulkSMS Dashboard**:
1. Login to https://dashboard.thaibulksms.com
2. Go to "API Key" section
3. Click on "bn-aura" app
4. Set Webhook URL: `https://bn-aura.vercel.app/api/webhooks/sms`
5. Select Method: **GET**
6. Enable SMS checkbox
7. Click "สร้าง API Key"

**Webhook Parameters** (auto-sent by ThaiBulkSMS):
- `message_id` - Unique message ID
- `status` - Delivery status (delivered, failed, etc.)
- `phone` - Recipient phone number
- `delivered_at` - Timestamp (optional)
- `error` - Error message if failed (optional)

---

## 🧪 Testing

### **Test 1: Send SMS (Manual)**

```typescript
import { sendSMS } from '@/lib/sms';

// Simple test
await sendSMS('0812345678', 'ทดสอบส่ง SMS จาก BN-Aura');

// Expected: SMS delivered to phone number
```

### **Test 2: Check Balance**

```typescript
import { smsService } from '@/lib/sms/smsService';

const balance = await smsService.checkBalance();
console.log('SMS Credits:', balance);
```

### **Test 3: Webhook Endpoint**

```bash
# Test webhook is active
curl https://bn-aura.vercel.app/api/webhooks/sms

# Expected response:
{
  "status": "ok",
  "message": "SMS Webhook endpoint is active",
  "timestamp": "2026-02-01T10:00:00.000Z"
}
```

### **Test 4: Simulate Delivery Report**

```bash
curl "https://bn-aura.vercel.app/api/webhooks/sms?message_id=test123&status=delivered&phone=0812345678"

# Expected response:
{
  "success": true,
  "message": "Webhook processed"
}
```

---

## 📊 Usage in System

### **Automatic (via Follow-up Engine)**

SMS will be sent automatically when:
- ✅ Appointment reminders (1 day before)
- ✅ Post-treatment follow-up
- ✅ Payment reminders
- ✅ Proposal notifications
- ✅ Scan results ready

### **Manual Sending**

```typescript
import { sendSMS, smsTemplates } from '@/lib/sms';

// Using template
const message = smsTemplates.appointmentReminder({
  customerName: 'สมหญิง',
  clinicName: 'BN Clinic',
  treatmentName: 'Laser Facial',
  appointmentDate: '5 ก.พ. 2569',
  appointmentTime: '10:00'
});

await sendSMS('0812345678', message);
```

---

## 💰 Pricing & Credits

**ThaiBulkSMS Rates**:
- Thai SMS: ฿0.50 - 1.50 per message
- English SMS: ฿0.50 - 1.00 per message
- Credits can be purchased at: https://thaibulksms.com

**Check Balance**:
```typescript
const credits = await smsService.checkBalance();
```

**Low Credit Alert**:
- System will log warning when credits < 100
- Manual top-up required at dashboard

---

## 🔒 Security

### **Best Practices**:
1. ✅ **Never commit credentials** to Git
2. ✅ Store in `.env.local` for development
3. ✅ Use Vercel Environment Variables for production
4. ✅ Rotate API keys periodically
5. ✅ Monitor webhook logs for suspicious activity

### **Webhook Security**:
- Currently accepting all GET requests
- Consider adding IP whitelist if needed
- Monitor for unusual patterns

---

## 🐛 Troubleshooting

### **SMS not sending?**

1. **Check API credentials**:
   ```bash
   echo $THAI_SMS_PLUS_API_KEY
   echo $THAI_SMS_PLUS_SECRET
   ```

2. **Check balance**:
   ```typescript
   const balance = await smsService.checkBalance();
   ```

3. **Check phone format**:
   - ✅ Valid: `0812345678`, `0912345678`, `0612345678`
   - ❌ Invalid: `812345678`, `+66812345678`

4. **Check logs**:
   ```bash
   # In development
   npm run dev
   # Look for SMS sending logs
   ```

### **Webhook not working?**

1. **Verify URL is accessible**:
   ```bash
   curl https://bn-aura.vercel.app/api/webhooks/sms
   ```

2. **Check ThaiBulkSMS settings**:
   - URL correct?
   - Method is GET?
   - SMS checkbox enabled?

3. **Test with parameters**:
   ```bash
   curl "https://bn-aura.vercel.app/api/webhooks/sms?message_id=test&status=delivered&phone=0812345678"
   ```

---

## 📈 Monitoring

### **Key Metrics to Track**:
- SMS sent per day
- Delivery success rate
- Failed messages
- Credits remaining
- Response rate from customers

### **Logs Location**:
- Development: Console output
- Production: Vercel logs or Sentry
- Database: `sms_logs` table (if created)

---

## 🎯 SMS Templates Available

1. **appointmentReminder** - เตือนนัด 1 วันก่อน
2. **appointmentConfirm** - ยืนยันนัดหมาย
3. **postTreatment** - ดูแลหลังทำ
4. **paymentReminder** - เตือนชำระเงิน
5. **proposalSent** - แจ้งข้อเสนอพร้อม
6. **scanReady** - ผลสแกนพร้อม
7. **promotion** - โปรโมชั่นพิเศษ
8. **birthday** - วันเกิด
9. **otp** - รหัส OTP
10. **notification** - ทั่วไป

**View all templates**: `lib/sms/templates.ts`

---

## 📞 Support

**ThaiBulkSMS Support**:
- Website: https://thaibulksms.com
- Dashboard: https://dashboard.thaibulksms.com
- Email: support@thaibulksms.com (assumed)

**BN-Aura SMS Integration**:
- Code: `lib/sms/smsService.ts`
- Webhook: `app/api/webhooks/sms/route.ts`
- Templates: `lib/sms/templates.ts`

---

## ✅ Checklist

**Initial Setup**:
- [x] API Key obtained
- [x] API Secret obtained
- [x] App name: bn-aura
- [ ] Add to `.env.local`
- [ ] Add to Vercel environment variables
- [ ] Configure webhook URL
- [ ] Test sending SMS
- [ ] Verify webhook receives delivery reports

**Production Ready**:
- [ ] Credits purchased (sufficient balance)
- [ ] Webhook tested and working
- [ ] SMS templates reviewed
- [ ] Monitoring set up
- [ ] Alert thresholds configured

---

**Last Updated**: February 1, 2026  
**Status**: ✅ Configuration Complete - Ready to Use  
**Provider**: ThaiBulkSMS  
**App**: bn-aura
