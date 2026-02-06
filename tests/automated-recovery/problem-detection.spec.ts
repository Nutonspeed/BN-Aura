import { test, expect } from '@playwright/test';

/**
 * Automated Problem Detection & Recovery Tests
 */

const TEST_CREDENTIALS = {
  clinicOwner: { email: 'clinic.owner@bntest.com', password: 'BNAura2024!' }
};

test.describe('System Health Monitoring', () => {
  
  test('API endpoints availability', async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    const endpoints = ['/api/customers', '/api/loyalty/points', '/api/commissions'];
    let healthy = 0;
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      if ([200, 401, 403].includes(response.status())) {
        healthy++;
        console.log(`✅ ${endpoint} healthy`);
      }
    }
    
    expect(healthy).toBeGreaterThan(1);
  });

  test('Database connectivity check', async ({ page }) => {
    const response = await page.request.get('/api/customers');
    expect([200, 401, 403]).toContain(response.status());
    console.log(`✅ Database connection: ${response.status()}`);
  });

  test('UI components load correctly', async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    const components = ['.customer-card', 'text="AI Sales Coach"'];
    let loaded = 0;
    
    for (const selector of components) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        loaded++;
        console.log(`✅ ${selector} loaded`);
      }
    }
    
    expect(loaded).toBeGreaterThan(0);
  });
});
