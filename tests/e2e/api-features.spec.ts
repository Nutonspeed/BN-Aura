import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 9-13 Features
 * Payment, Subscriptions, LINE, OTP, Consent, Notifications
 */

test.describe('Payment & Subscription APIs', () => {
  test('subscriptions API returns plans', async ({ request }) => {
    const res = await request.get('/api/subscriptions?action=plans');
    expect(res.status()).toBeLessThan(500);
    const data = await res.json();
    // Should return plans or auth error
    expect(data).toBeDefined();
  });

  test('Omise charge API rejects missing params', async ({ request }) => {
    const res = await request.post('/api/payments/create-omise-charge', {
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('commission rules API responds', async ({ request }) => {
    const res = await request.get('/api/commissions/rules');
    expect(res.status()).toBeLessThan(500);
  });

  test('commission payouts API responds', async ({ request }) => {
    const res = await request.get('/api/commissions/payouts');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('LINE Integration APIs', () => {
  test('LINE login status check', async ({ request }) => {
    const res = await request.get('/api/auth/line?action=status');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('configured');
  });

  test('LINE notify endpoint info', async ({ request }) => {
    const res = await request.get('/api/notifications/line');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.endpoints).toBeDefined();
    expect(data.data.endpoints.length).toBeGreaterThan(0);
  });

  test('LINE webhook endpoint responds', async ({ request }) => {
    const res = await request.post('/api/webhooks/line', {
      data: { events: [] },
    });
    expect(res.ok()).toBe(true);
  });
});

test.describe('OTP API', () => {
  test('OTP send rejects invalid phone', async ({ request }) => {
    const res = await request.post('/api/auth/otp', {
      data: { phone: '12345' },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid');
  });

  test('OTP verify rejects missing params', async ({ request }) => {
    const res = await request.patch('/api/auth/otp', {
      data: {},
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('PDPA Consent API', () => {
  test('consent API responds', async ({ request }) => {
    const res = await request.get('/api/consent');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('SMS API', () => {
  test('SMS webhook endpoint is active', async ({ request }) => {
    const res = await request.get('/api/webhooks/sms');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });
});

test.describe('Analytics & Reports APIs', () => {
  test('advanced analytics API responds', async ({ request }) => {
    const res = await request.get('/api/analytics/advanced');
    expect(res.ok()).toBe(true);
  });

  test('executive analytics API responds', async ({ request }) => {
    const res = await request.get('/api/analytics/executive');
    expect(res.status()).toBeLessThan(500);
  });

  test('finance analytics API responds', async ({ request }) => {
    const res = await request.get('/api/finance/analytics');
    expect(res.status()).toBeLessThan(500);
  });

  test('staff performance API responds', async ({ request }) => {
    const res = await request.get('/api/analytics/staff-performance');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Notification API', () => {
  test('notifications API responds', async ({ request }) => {
    const res = await request.get('/api/notifications');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('PWA Assets', () => {
  test('manifest.json is accessible', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.name).toBe('BN-Aura - Premium Aesthetic Intelligence');
    expect(data.display).toBe('standalone');
  });

  test('service worker is accessible', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBe(true);
    const text = await res.text();
    expect(text).toContain('Service Worker');
  });
});
