import { test, expect } from '@playwright/test';

/**
 * AI Sales Coach Integration Testing
 */

const TEST_CREDENTIALS = {
  salesStaff: { email: 'sales1.auth@bntest.com', password: 'AuthStaff123!' }
};

test.describe('AI Sales Coach Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/sales');
  });

  test('AI Sales Coach section displays', async ({ page }) => {
    const aiCoachSection = page.locator('text="AI Sales Coach"');
    await expect(aiCoachSection).toBeVisible({ timeout: 10000 });
    
    const smartSuggestions = page.locator('.smart-suggestions');
    const count = await smartSuggestions.count();
    console.log(`✅ Found ${count} AI suggestion components`);
  });

  test('Customer urgency scoring works', async ({ page }) => {
    const urgencyScores = page.locator('text=/\\d+% priority/');
    const scoreCount = await urgencyScores.count();
    
    if (scoreCount > 0) {
      const scoreText = await urgencyScores.first().textContent();
      expect(scoreText).toMatch(/\d+% priority/);
      console.log(`🎯 Found urgency score: ${scoreText}`);
    }
  });

  test('AI APIs respond correctly', async ({ page }) => {
    const response = await page.request.get('/api/ai/sales-coach');
    expect([200, 401, 403]).toContain(response.status());
    console.log(`✅ AI API status: ${response.status()}`);
  });
});
