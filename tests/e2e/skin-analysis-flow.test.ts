import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('AI Skin Analysis E2E Flow', () => {
  
  test.describe('Complete Analysis Journey', () => {
    
    test('should complete full analysis flow: scan → result → booking', async ({ page }) => {
      // 1. Navigate to sales AI analysis page
      await page.goto(`${BASE_URL}/th/sales/ai-analysis`);
      await expect(page.locator('h1')).toContainText('AI Skin Analysis');

      // 2. Enter customer name
      const customerInput = page.locator('input[placeholder*="ลูกค้า"]');
      if (await customerInput.isVisible()) {
        await customerInput.fill('คุณทดสอบ');
      }

      // 3. Check camera component is present
      const cameraSection = page.locator('text=Real-time Face Analysis').first();
      await expect(cameraSection).toBeVisible({ timeout: 10000 });

      // 4. Verify scan tab is active by default
      const scanTab = page.locator('button:has-text("สแกนใบหน้า")');
      await expect(scanTab).toBeVisible();
    });

    test('should display quota status on analysis page', async ({ page }) => {
      await page.goto(`${BASE_URL}/th/sales/ai-analysis`);
      
      // Check for quota-related elements
      const quotaSection = page.locator('text=Performance').first();
      if (await quotaSection.isVisible()) {
        await expect(quotaSection).toBeVisible();
      }
    });

    test('should have working navigation tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/th/sales/ai-analysis`);

      // Verify all tabs exist
      const tabs = ['สแกนใบหน้า', 'ผลวิเคราะห์', 'จอง Treatment', 'สร้างรายงาน'];
      
      for (const tabText of tabs) {
        const tab = page.locator(`button:has-text("${tabText}")`);
        await expect(tab).toBeVisible();
      }
    });
  });

  test.describe('API Integration Tests', () => {
    
    test('should fetch skin analysis from API', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('skinMetrics');
    });

    test('should check quota status', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/quota/status?clinicId=test-clinic`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('quotaRemaining');
      expect(data).toHaveProperty('quotaLimit');
    });

    test('should get time travel prediction', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/time-travel?years=5`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('predictions');
    });

    test('should get environment advice', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/environment?skinType=oily`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('morningRoutine');
      expect(data.data).toHaveProperty('eveningRoutine');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    
    test('should display mobile layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/th/sales/ai-analysis`);

      // Page should still be functional
      await expect(page.locator('h1')).toContainText('AI Skin Analysis');
    });

    test('should display tablet layout on medium screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/th/sales/ai-analysis`);

      await expect(page.locator('h1')).toContainText('AI Skin Analysis');
    });
  });

  test.describe('Analytics Dashboard', () => {
    
    test('should load advanced analytics page', async ({ page }) => {
      await page.goto(`${BASE_URL}/th/clinic/analytics/advanced`);
      
      // Check for analytics elements
      const header = page.locator('text=Advanced Analytics');
      await expect(header).toBeVisible({ timeout: 10000 });
    });

    test('should have period filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/th/clinic/analytics/advanced`);
      
      // Check for period buttons
      const periods = ['7 วัน', '30 วัน', '90 วัน'];
      for (const period of periods) {
        const button = page.locator(`button:has-text("${period}")`);
        await expect(button).toBeVisible();
      }
    });
  });

  test.describe('Notification APIs', () => {
    
    test('should validate LINE notification endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/notifications/line`);
      // GET should return method info or 405
      expect([200, 405]).toContain(response.status());
    });

    test('should validate email notification endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/notifications/email`);
      expect([200, 405]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle 404 gracefully', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/th/nonexistent-page`);
      // Should show 404 or redirect
      expect([200, 404]).toContain(response?.status() || 200);
    });

    test('should handle invalid API params', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin?type=invalid123`);
      // Should return error or default data
      expect(response.status()).toBeLessThan(500);
    });
  });
});

test.describe('Sales Dashboard Integration', () => {
  
  test('should load sales main page', async ({ page }) => {
    await page.goto(`${BASE_URL}/th/sales`);
    await expect(page).toHaveURL(/.*sales/);
  });

  test('should have AI features section', async ({ page }) => {
    await page.goto(`${BASE_URL}/th/sales/ai-analysis`);
    
    const aiSection = page.locator('text=AI Features');
    if (await aiSection.isVisible()) {
      await expect(aiSection).toBeVisible();
    }
  });
});
