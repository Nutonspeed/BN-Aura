# BN-Aura API Reference

## Overview

Base URL: `https://bn-aura.vercel.app/api`

All API endpoints require authentication via Supabase JWT token in the Authorization header.

---

## Authentication

```http
Authorization: Bearer <supabase_jwt_token>
```

---

## AI Analysis APIs

### GET /api/analysis/skin
Get skin analysis with 8 metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "skinMetrics": {
      "spots": 72,
      "wrinkles": 85,
      "texture": 78,
      "pores": 65,
      "uvDamage": 82,
      "brownSpots": 70,
      "redAreas": 88,
      "bacteria": 90
    },
    "overallScore": 79,
    "skinAge": 32
  }
}
```

### GET /api/analysis/time-travel
Get future skin prediction.

**Parameters:**
- `years` (number): Years to predict (1-20)

### GET /api/analysis/ar-preview
Get AR treatment preview recommendations.

### GET /api/analysis/skin-twin
Find similar skin profiles.

### POST /api/ai/recommendations
Get AI-powered treatment recommendations.

**Body:**
```json
{
  "skinType": "oily",
  "age": 35,
  "concerns": ["wrinkles", "spots"],
  "previousTreatments": ["HydraFacial"]
}
```

### POST /api/ai/chat
Chat with AI skin consultant.

**Body:**
```json
{
  "message": "ควรทำ treatment อะไรดี?",
  "skinType": "combination",
  "history": ["previous messages..."]
}
```

---

## Quota APIs

### GET /api/quota/status
Get clinic quota status.

**Parameters:**
- `clinicId` (string): Clinic ID

**Response:**
```json
{
  "quotaRemaining": 35,
  "quotaLimit": 100,
  "quotaUsed": 65,
  "resetDate": "2026-03-01",
  "plan": "professional"
}
```

### POST /api/quota/status
Record quota usage or perform actions.

**Body:**
```json
{
  "action": "record",
  "clinicId": "...",
  "scanType": "detailed"
}
```

---

## Monitoring APIs

### GET /api/monitoring/health
Check system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T12:00:00Z",
  "latency": 120,
  "checks": [
    { "service": "database", "status": "healthy", "latency": 50 },
    { "service": "ai_gateway", "status": "healthy", "latency": 200 }
  ]
}
```

### GET /api/monitoring/ai-usage
Get AI usage statistics.

**Parameters:**
- `days` (number): Days to look back (default: 7)

### GET /api/alerts/quota
Get quota alerts for clinics.

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-123",
        "type": "quota_critical",
        "severity": "urgent",
        "clinicName": "Bangkok Beauty",
        "message": "Quota at 95%",
        "acknowledged": false
      }
    ]
  }
}
```

### POST /api/alerts/quota
Manage quota alerts (acknowledge, action_taken, test_alert).

---

## Notification APIs

### POST /api/notifications/line
Send LINE notification.

**Body:**
```json
{
  "userId": "...",
  "type": "analysis_complete",
  "data": { "score": 85 }
}
```

### POST /api/notifications/email
Send email notification.

**Body:**
```json
{
  "to": "customer@email.com",
  "template": "analysis-report",
  "variables": { "name": "John", "score": 85 }
}
```

### POST /api/notifications/push/subscribe
Subscribe to push notifications.

---

## Data APIs

### GET /api/data/export
Export data as CSV or JSON.

**Parameters:**
- `type`: `customers` | `analyses`
- `format`: `csv` | `json`
- `clinicId`: Clinic ID

---

## CRM Integration APIs

### POST /api/integrations/crm/contact
Sync contact to CRM.

### POST /api/integrations/crm/deal
Sync deal to CRM.

---

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Codes
- `401` - Unauthorized
- `403` - Forbidden (no access)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Server error

---

## Rate Limits

- **Standard**: 100 requests/minute
- **AI Endpoints**: 60 requests/minute
- **Export**: 10 requests/minute

---

## Webhooks

Configure webhooks at `/api/webhooks` to receive events:
- `analysis.completed`
- `booking.created`
- `customer.updated`
- `quota.warning`

---

## SDK Usage

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get analysis
const { data } = await fetch('/api/analysis/skin', {
  headers: { Authorization: `Bearer ${session.access_token}` }
}).then(r => r.json());
```

---

## Support

For API support, contact: api-support@bn-aura.com
