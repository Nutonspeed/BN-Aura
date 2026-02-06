# BN-Aura Beauty Clinic API - Quick Start Guide

## Getting Started with BN-Aura API

Welcome to the BN-Aura Beauty Clinic Management System API! This guide will help you quickly integrate with our comprehensive beauty clinic management platform.

### 🚀 Quick Setup

#### 1. Authentication
```javascript
// Get your API key from the BN-Aura dashboard
const apiKey = 'your-api-key-here';

// Initialize the SDK
const BNAura = new BNAuraSDK({
  baseURL: 'https://api.bn-aura.com/v1',  // or localhost:3000/api for development
  apiKey: apiKey,
  timeout: 30000
});
```

#### 2. Basic Usage Examples

**Generate AI Consultation**
```javascript
const consultation = await BNAura.generateConsultation('customer_001', {
  skinType: 'combination',
  concerns: ['acne', 'aging'],
  severity: 'moderate'
}, {
  budget: 25000,
  timeAvailable: 90
});

console.log('AI Consultation:', consultation.data);
// Output: Treatment recommendations, estimated costs, timeline
```

**Register Mobile User**
```javascript
const mobileUser = await BNAura.registerMobileUser({
  userType: 'sales',
  profile: {
    name: 'Sales Staff Name',
    phone: '081-234-5678',
    clinicId: 'clinic_bangkok_001'
  },
  deviceInfo: {
    platform: 'ios',
    pushToken: 'device_push_token'
  }
});
```

**Book Treatment**
```javascript
const booking = await BNAura.bookTreatment(
  'customer_001',
  'Laser Hair Removal - Full Legs',
  '2025-02-10T14:00:00Z',
  15000
);
```

**Track Sales Performance**
```javascript
const performance = await BNAura.trackSalesPerformance('sales_001', {
  consultations: 45,
  bookings: 32,
  revenue: 580000,
  satisfaction: 4.8
});
```

### 📱 Common Integration Patterns

#### Customer Journey Flow
```javascript
// 1. Generate AI consultation
const consultation = await BNAura.generateConsultation(customerId, skinAnalysis);

// 2. Book recommended treatment
const booking = await BNAura.bookTreatment(
  customerId, 
  consultation.recommendations[0].treatment,
  scheduledDate,
  consultation.recommendations[0].price
);

// 3. Track customer journey
const journey = await BNAura.mapCustomerJourney(customerId, [
  { stage: 'consultation', channel: 'ai_assistant', timestamp: new Date().toISOString() },
  { stage: 'booking', channel: 'mobile_app', timestamp: new Date().toISOString() }
]);
```

#### Multi-Clinic Management
```javascript
// Register new clinic
const clinic = await BNAura.registerClinic({
  clinicName: 'BN-Aura Bangkok Central',
  franchiseType: 'owned',
  location: { city: 'Bangkok', province: 'Bangkok' },
  status: 'active',
  manager: { name: 'Manager Name', email: 'manager@clinic.com' }
});

// Generate cross-clinic performance report
const report = await BNAura.generateCrossClinicReport([
  'clinic_bangkok_001',
  'clinic_phuket_001',
  'clinic_chiangmai_001'
]);
```

### 🔧 Error Handling

```javascript
try {
  const result = await BNAura.generateConsultation(customerId, skinAnalysis);
  console.log('Success:', result);
} catch (error) {
  console.error('API Error:', error.message);
  // Handle specific error cases
  if (error.message.includes('authentication')) {
    // Handle auth error
  } else if (error.message.includes('rate limit')) {
    // Handle rate limiting
  }
}
```

### 📊 Response Formats

All API responses follow this standard format:
```javascript
{
  "success": true,
  "data": { /* actual response data */ },
  "message": "Operation completed successfully",
  "insights": { /* additional insights where applicable */ }
}
```

### 🔑 API Endpoints Overview

| Endpoint | Purpose | Methods |
|----------|---------|---------|
| `/ai/sales-assistant` | AI consultation & recommendations | POST |
| `/mobile/sales-app` | Mobile app operations | POST, GET |
| `/analytics/advanced-sales` | Sales analytics & reporting | POST, GET |
| `/management/multi-clinic` | Multi-clinic management | POST, GET |
| `/partners/treatment` | Partner API integration | POST |
| `/testing/integration` | System integration testing | POST, GET |
| `/security/performance-audit` | Security & performance auditing | POST, GET |

### 🎯 Best Practices

1. **Authentication**: Always use HTTPS and store API keys securely
2. **Rate Limiting**: Implement retry logic with exponential backoff
3. **Error Handling**: Check response status and handle errors gracefully
4. **Data Validation**: Validate input data before sending to API
5. **Monitoring**: Log API calls and monitor response times

### 📈 Production Considerations

- Use environment variables for API keys
- Implement proper logging and monitoring
- Set up health checks for your integration
- Consider implementing caching for frequently accessed data
- Use webhooks where available to reduce polling

### 🆘 Support & Resources

- **API Documentation**: `/docs/api/openapi-spec.json`
- **SDK Downloads**: Available for JavaScript/TypeScript, Python, PHP
- **Integration Examples**: Check `/examples` directory
- **Support Email**: api-support@bn-aura.com
- **Status Page**: https://status.bn-aura.com

### 🔄 Changelog

**v1.0.0** (Current)
- Initial release with full API coverage
- AI Sales Assistant integration
- Mobile app support
- Advanced analytics
- Multi-clinic management
- Partner API integration
- Security & performance auditing
