# LINE Messaging API Integration Guide

## Overview
Integration สำหรับ LINE Official Account ให้สามารถส่งข้อความถึงลูกค้าผ่าน LINE

## Setup Instructions

### 1. สร้าง LINE Official Account
1. ไปที่ https://manager.line.biz/
2. สร้าง Official Account ใหม่
3. ตั้งค่าชื่อ คลินิก และรูปโปรไฟล์

### 2. สร้าง Messaging API Channel
1. ไปที่ https://developers.line.biz/console/
2. สร้าง Provider (ถ้ายังไม่มี)
3. สร้าง Messaging API Channel
4. เลือก Provider ที่สร้างไว้
5. กรอกข้อมูล Channel

### 3. ตั้งค่า Channel
1. ไปที่ **Messaging API** tab
2. คัดลอก **Channel access token** (long-lived)
3. คัดลอก **Channel secret**
4. ตั้งค่า **Webhook URL**: `https://your-domain.com/api/webhooks/line`
5. เปิด **Use webhooks**
6. (Optional) ปิด **Auto-reply messages** ถ้าต้องการควบคุมเอง

### 4. เพิ่ม Environment Variables

```bash
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
```

### 5. Implement Webhook Handler

สร้างไฟล์ `app/api/webhooks/line/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { lineService } from '@/lib/line/lineService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    // Verify signature
    if (!lineService.verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const events = JSON.parse(body).events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        // Handle incoming message
        await handleMessage(event);
      } else if (event.type === 'follow') {
        // User added bot as friend
        await handleFollow(event);
      } else if (event.type === 'unfollow') {
        // User blocked/removed bot
        await handleUnfollow(event);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handleMessage(event: any) {
  const userId = event.source.userId;
  const messageText = event.message.text;

  // Process message and respond
  // Example: Link LINE user to customer account
  // Example: Auto-reply with menu options
}

async function handleFollow(event: any) {
  const userId = event.source.userId;
  
  // Welcome message
  await lineService.sendMessage({
    to: userId,
    message: 'สวัสดีค่ะ! ยินดีต้อนรับสู่ BN-Aura\nกรุณาระบุเบอร์โทรศัพท์เพื่อเชื่อมโยงบัญชี',
    quickReply: [
      { label: '📞 ระบุเบอร์โทร', text: 'ระบุเบอร์โทร' },
      { label: '📅 จองนัด', text: 'จองนัดหมาย' }
    ]
  });
}

async function handleUnfollow(event: any) {
  const userId = event.source.userId;
  // Update customer record: LINE disconnected
}
```

## Features

### 1. Send Text Message
```typescript
import { sendLineMessage } from '@/lib/line/lineService';

await sendLineMessage(
  'U1234567890abcdef', // LINE User ID
  'สวัสดีค่ะ! นัดหมายของคุณคือวันพรุ่งนี้ 10:00 น.'
);
```

### 2. Send Message with Quick Reply
```typescript
await lineService.sendMessage({
  to: userId,
  message: 'ต้องการยืนยันนัดหมายไหมคะ?',
  quickReply: [
    { label: '✅ ยืนยัน', text: 'ยืนยันนัดหมาย' },
    { label: '❌ ยกเลิก', text: 'ยกเลิกนัดหมาย' }
  ]
});
```

### 3. Send Message with Image
```typescript
await lineService.sendMessage({
  to: userId,
  message: 'ผลการสแกนผิวของคุณ',
  imageUrl: 'https://example.com/scan-result.jpg'
});
```

### 4. Send Broadcast
```typescript
await lineService.sendBroadcast(
  'โปรโมชั่นพิเศษ! ลด 20% ทุกคอร์สในเดือนนี้'
);
```

### 5. Get User Profile
```typescript
const profile = await lineService.getUserProfile(userId);
console.log(profile.displayName); // "สมหญิง ใจดี"
```

## Linking LINE to Customer Account

เก็บ LINE User ID ใน customer metadata:

```typescript
// เมื่อ user ส่งเบอร์โทรมา
const phone = '0812345678';

// หา customer จาก phone
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('phone', phone)
  .single();

if (customer) {
  // Update customer metadata
  await supabase
    .from('customers')
    .update({
      metadata: {
        ...customer.metadata,
        lineUserId: userId,
        lineDisplayName: profile.displayName,
        lineLinkedAt: new Date().toISOString()
      }
    })
    .eq('id', customer.id);

  // Confirm to user
  await lineService.sendMessage({
    to: userId,
    message: `เชื่อมโยงบัญชีสำเร็จ!\nคุณ${customer.full_name}\n\nตอนนี้คุณสามารถรับข้อความแจ้งเตือนผ่าน LINE แล้ว`
  });
}
```

## Rich Menu (Advanced)

สร้าง menu ด้านล่างหน้าจอ LINE chat:

```typescript
// TODO: Implement Rich Menu
// Features:
// - จองนัดหมาย
// - ดูประวัติการรักษา
// - โปรโมชั่น
// - ติดต่อคลินิก
```

## Best Practices

1. **ขอ consent ก่อนส่งข้อความ**: ให้ลูกค้า opt-in ก่อนส่งการแจ้งเตือน
2. **ส่งข้อความที่มีคุณค่า**: ไม่ spam, ส่งเฉพาะข้อมูลที่เป็นประโยชน์
3. **ตอบกลับเร็ว**: ตอบข้อความภายใน 1-5 นาที
4. **ใช้ Quick Reply**: ทำให้ user ตอบกลับง่าย
5. **Personalize**: ใช้ชื่อลูกค้า, ส่งข้อความที่เกี่ยวข้อง

## Limitations

- **Push message limit**: 500 ข้อความ/เดือน (free plan)
- **Broadcast**: ต้องมี followers อย่างน้อย 100 คน
- **Rich Menu**: ต้อง verify Official Account
- **Message types**: รองรับ text, image, template เท่านั้น (free plan)

## Upgrade to Premium

LINE Official Account มี 3 plans:
1. **Free**: 500 messages/month
2. **Light**: ฿5,000/month, 5,000 messages
3. **Standard**: ฿15,000/month, 30,000 messages

## Resources

- [LINE Developers](https://developers.line.biz/)
- [Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [LINE Manager](https://manager.line.biz/)
- [Rich Menu Creator](https://developers.line.biz/en/services/rich-menu-images/)

## Troubleshooting

### ข้อความส่งไม่ออก
- ตรวจสอบ Channel Access Token
- ตรวจสอบว่า user เป็น friend กับ bot
- ตรวจสอบ message limit

### Webhook ไม่ทำงาน
- ตรวจสอบ webhook URL
- ตรวจสอบ signature verification
- เปิด webhook ใน LINE Manager

### User ID ไม่ถูกต้อง
- User ID ได้จาก webhook event เท่านั้น
- ไม่สามารถรู้ User ID ก่อน user ติดต่อมา
