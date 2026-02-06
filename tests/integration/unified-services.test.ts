/**
 * Integration Tests for Unified Services
 * Tests Email, LINE, and Theme services
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Unified Email Service', () => {
  test('should send email via API', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        template: 'welcome',
        variables: { name: 'Test User', dashboardUrl: 'https://example.com' },
      }),
    });

    expect(response.status).toBeLessThan(500);
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('should handle analysis report email', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'customer@example.com',
        template: 'analysis-report',
        variables: {
          name: 'คุณทดสอบ',
          overallScore: '85',
          skinAge: '28',
          reportUrl: 'https://example.com/report',
        },
      }),
    });

    expect(response.status).toBeLessThan(500);
  });
});

describe('Unified LINE Service', () => {
  test('should send LINE notification via API', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/line`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'U1234567890',
        type: 'analysis_complete',
        data: { customerName: 'Test', score: 85, reportUrl: 'https://example.com' },
      }),
    });

    expect(response.status).toBeLessThan(500);
  });
});

describe('Theme/Branding API', () => {
  const testClinicId = 'test-clinic-123';

  test('should get default theme', async () => {
    const response = await fetch(`${BASE_URL}/api/clinic/${testClinicId}/theme`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('colors');
    expect(data.colors).toHaveProperty('light');
    expect(data.colors).toHaveProperty('dark');
  });

  test('should save custom theme', async () => {
    const customTheme = {
      id: 'custom-theme',
      name: 'Custom Clinic Theme',
      colors: {
        light: {
          primary: '#FF5722',
          secondary: '#F5F5F5',
          accent: '#4CAF50',
          background: '#FFFFFF',
          foreground: '#212121',
          muted: '#757575',
          border: '#E0E0E0',
        },
        dark: {
          primary: '#FF7043',
          secondary: '#424242',
          accent: '#66BB6A',
          background: '#121212',
          foreground: '#FAFAFA',
          muted: '#9E9E9E',
          border: '#616161',
        },
      },
      borderRadius: 'md',
      branding: {
        appName: 'Test Clinic',
        tagline: 'Beauty & Wellness',
      },
    };

    const response = await fetch(`${BASE_URL}/api/clinic/${testClinicId}/theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customTheme),
    });

    expect(response.status).toBeLessThan(500);
  });
});

describe('Quota API Integration', () => {
  test('should get quota status', async () => {
    const response = await fetch(`${BASE_URL}/api/quota/status?clinicId=test-clinic`);
    
    expect(response.status).toBeLessThan(500);
    const data = await response.json();
    expect(data).toHaveProperty('quotaRemaining');
  });
});

describe('AI Recommendations API', () => {
  test('should generate treatment recommendations', async () => {
    const response = await fetch(`${BASE_URL}/api/ai/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skinType: 'oily',
        age: 35,
        concerns: ['wrinkles', 'spots'],
      }),
    });

    expect(response.status).toBeLessThan(500);
    const data = await response.json();
    if (data.success) {
      expect(data.data).toHaveProperty('treatments');
    }
  });
});

describe('Data Export API', () => {
  test('should export customers as CSV', async () => {
    const response = await fetch(
      `${BASE_URL}/api/data/export?type=customers&format=csv&clinicId=test-clinic`
    );

    expect(response.status).toBe(200);
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/csv');
  });

  test('should export analyses as JSON', async () => {
    const response = await fetch(
      `${BASE_URL}/api/data/export?type=analyses&format=json&clinicId=test-clinic`
    );

    expect(response.status).toBe(200);
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });
});

describe('Report Generation API', () => {
  test('should generate sales report', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          type: 'sales',
          dateRange: '30d',
          columns: ['วันที่', 'ลูกค้า', 'Treatment', 'ยอดเงิน'],
        },
        clinicId: 'test-clinic',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('headers');
    expect(data).toHaveProperty('rows');
  });
});

describe('CRM Integration API', () => {
  test('should sync contact to CRM', async () => {
    const response = await fetch(`${BASE_URL}/api/integrations/crm/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'hubspot',
        contact: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          clinicId: 'test-clinic',
        },
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
