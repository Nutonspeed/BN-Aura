# 🌐 Network Map - Real Data Integration Setup

## 📋 สถานะปัจจุบัน

**❌ ปัจจุบันใช้ Mock Data**
- Network Map กำลังใช้ข้อมูลจำลอง (mock data)
- ยังไม่ได้เชื่อมต่อกับ Supabase database จริง
- Real-time updates เป็นการจำลองเท่านั้น

## 🚀 ขั้นตอนการตั้งค่า Real Data

### 1. สร้าง Supabase Table

```sql
-- รัน SQL นี้ใน Supabase SQL Editor
-- ไฟล์: database/network_nodes_schema.sql

CREATE TABLE network_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('clinic', 'server', 'database', 'api', 'auth', 'storage')),
  status VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning')),
  location VARCHAR(255) NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- เพิ่ม sample data
INSERT INTO network_nodes (name, type, status, location, metrics) VALUES
('Main Clinic', 'clinic', 'online', 'Bangkok', '{"latency": 45, "uptime": 99.9, "load": 65, "users": 150, "staff": 12}'),
('Database Server', 'database', 'online', 'Data Center', '{"latency": 12, "uptime": 99.8, "load": 78}'),
-- ... (ดูไฟล์เต็มใน database/network_nodes_schema.sql)
```

### 2. ตั้งค่า Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. สร้าง Supabase Client

```typescript
// utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. อัพเดท Hook ให้ใช้ Real Data

```typescript
// hooks/useRealNetworkData.ts (สร้างใหม่)
import { useRealNetworkData } from '@/hooks/useRealNetworkData';

// ใน page.tsx
const { nodes, isLoading, error } = useRealNetworkData();
```

## 🔧 การแก้ไขปัจจุบัน

### 1. แก้ไข Import Path

```typescript
// แก้จาก
import { useRealTimeNetworkData } from '@/hooks/useRealTimeNetworkData';

// เป็น
import { useRealNetworkData } from '@/hooks/useRealNetworkData';
```

### 2. อัพเดท Hook Usage

```typescript
// แก้จาก
const { nodes: realTimeNodes, isLoading } = useRealTimeNetworkData({
  initialNodes: nodes,
  refreshInterval: 5000,
  enableWebSocket: true
});

// เป็น
const { nodes: realTimeNodes, isLoading, error } = useRealNetworkData();
```

### 3. แก้ไข useEffect

```typescript
// แก้จาก
useEffect(() => {
  if (realTimeNodes.length > 0) {
    setNodes(realTimeNodes);
  }
}, [realTimeNodes]);

// เป็น
useEffect(() => {
  if (realTimeNodes.length > 0) {
    setNodes(realTimeNodes);
  }
  setLoading(isLoading);
}, [realTimeNodes, isLoading]);
```

## 🧪 การทดสอบ

### 1. ทดสอบ Database Connection

```typescript
// เพิ่ม error handling
if (dataError) {
  console.error('Database error:', dataError);
  // แสดง error message ใน UI
}

if (connectionStatus === 'disconnected') {
  // แสดง connection error
}
```

### 2. ทดสอบ Real-time Updates

```typescript
// ตรวจสอบว่า real-time subscription ทำงาน
useEffect(() => {
  console.log('Connection status:', connectionStatus);
  console.log('Last update:', lastUpdate);
}, [connectionStatus, lastUpdate]);
```

## 📊 ข้อมูลที่ต้องมีใน Database

### Network Node Structure

```json
{
  "id": "uuid",
  "name": "Main Clinic",
  "type": "clinic",
  "status": "online",
  "location": "Bangkok",
  "metrics": {
    "latency": 45,
    "uptime": 99.9,
    "load": 65,
    "users": 150,
    "staff": 12
  },
  "is_active": true
}
```

### Metrics สำหรับแต่ละ Type

**Clinic:**
```json
{
  "latency": 45,
  "uptime": 99.9,
  "load": 65,
  "users": 150,
  "staff": 12
}
```

**Server/Database/API/Auth/Storage:**
```json
{
  "latency": 12,
  "uptime": 99.8,
  "load": 78
}
```

## 🔄 Real-time Updates

### Supabase Real-time Setup

```typescript
// ใน useRealNetworkData hook
const channel = supabase
  .channel('network_nodes_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'network_nodes',
    filter: 'is_active=eq.true'
  }, (payload) => {
    // Handle real-time updates
    console.log('Real-time update:', payload);
  })
  .subscribe();
```

### การอัพเดทข้อมูล

```typescript
// อัพเดต node status
await supabase
  .from('network_nodes')
  .update({ 
    status: 'warning',
    metrics: { ...metrics, latency: 89 }
  })
  .eq('id', nodeId);

// เพิ่ม node ใหม่
await supabase
  .from('network_nodes')
  .insert([{
    name: 'New Clinic',
    type: 'clinic',
    status: 'online',
    location: 'New Location',
    metrics: { latency: 50, uptime: 99.5, load: 60, users: 100, staff: 8 }
  }]);
```

## 🚨 การจัดการ Error

### Connection Errors

```typescript
if (error) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Connection Error</h3>
        <p className="text-white/60 mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 bg-blue-500 rounded-lg text-white">
          Retry
        </button>
      </div>
    </div>
  );
}
```

### Loading States

```typescript
if (isLoading && nodes.length === 0) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
        <p className="text-white/60">Loading network data...</p>
      </div>
    </div>
  );
}
```

## 📱 การทดสอบใน Production

### 1. ตรวจสอบ Environment Variables

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. ทดสอบ Database Connection

```bash
# ใน browser console
fetch('/api/test-connection').then(r => r.json()).then(console.log);
```

### 3. ตรวจสอบ Real-time

```bash
# ดูใน Supabase Dashboard
# Realtime > network_nodes > View connections
```

## 🎯 ขั้นตอนถัดไป

### 1. สร้าง Supabase Client
```bash
# สร้างไฟล์ utils/supabase/client.ts
```

### 2. แก้ไข TypeScript Errors
```typescript
# แก้ปัญหา import paths และ type definitions
```

### 3. ทดสอบ Real-time Connection
```typescript
# ตรวจสอบว่า subscription ทำงานถูกต้อง
```

### 4. Deploy และ Monitor
```bash
# Deploy และตรวจสอบใน production environment
```

---

## 📞 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Import Path Error**
   - ตรวจสอบว่ามีไฟล์ `utils/supabase/client.ts`
   - ตรวจสอบ TypeScript path mapping

2. **Real-time Not Working**
   - ตรวจสอบ Supabase RLS policies
   - ตรวจสอบ WebSocket connection

3. **Data Not Loading**
   - ตรวจสอบ environment variables
   - ตรวจสอบ database permissions

---

**สถานะปัจจุบัน**: ✅ Infrastructure พร้อม | ❌ ยังไม่ได้เชื่อมต่อจริง  
**ขั้นตอนถัดไป**: สร้าง Supabase client และแก้ไข TypeScript errors
