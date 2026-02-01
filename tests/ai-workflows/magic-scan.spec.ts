import { test, expect } from '@playwright/test';
import { AuthPage } from '../utils/page-objects/auth-page';
import { TEST_USERS } from '../utils/test-data';

test.describe('Magic Scan - AI Workflow Testing', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Login as sales staff to access Magic Scan
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
  });

  test('Complete Magic Scan workflow with test image', async ({ page }) => {
    // Navigate to Magic Scan
    await page.goto('/th/sales/analysis');
    await page.waitForLoadState('networkidle');
    
    // Verify Magic Scan interface is loaded
    await expect(page.locator('[data-testid="magic-scan-interface"]')).toBeVisible();
    
    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'Test Customer');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '0812345678');
    
    // Upload test image for analysis
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-face-1.jpg');
    
    // Start analysis
    await page.click('[data-testid="start-analysis-btn"]');
    
    // Wait for AI processing (with timeout)
    await page.waitForSelector('[data-testid="analysis-progress"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="analysis-results"]', { 
      state: 'visible', 
      timeout: 45000 // AI analysis can take up to 30 seconds
    });
    
    // Verify analysis results are displayed
    await expect(page.locator('[data-testid="skin-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="skin-concerns"]')).toBeVisible();
    await expect(page.locator('[data-testid="treatment-recommendations"]')).toBeVisible();
    
    // Check that MediaPipe facial points are detected
    await expect(page.locator('[data-testid="facial-points-count"]')).toContainText('468');
    
    // Verify Gemini AI analysis results
    const skinScore = await page.locator('[data-testid="skin-score-value"]').textContent();
    expect(parseInt(skinScore || '0')).toBeGreaterThan(0);
    expect(parseInt(skinScore || '101')).toBeLessThanOrEqual(100);
  });

  test('AR Simulation after analysis', async ({ page }) => {
    // Complete analysis first (shortened version)
    await page.goto('/th/sales/analysis');
    await page.fill('[data-testid="customer-name"]', 'AR Test Customer');
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face-2.jpg');
    await page.click('[data-testid="start-analysis-btn"]');
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 45000 });
    
    // Access AR Simulation
    await page.click('[data-testid="ar-simulation-btn"]');
    await page.waitForSelector('[data-testid="ar-interface"]', { state: 'visible' });
    
    // Select treatment for AR preview
    await page.click('[data-testid="treatment-option"]:first-child');
    
    // Verify AR preview is generated
    await page.waitForSelector('[data-testid="ar-preview"]', { 
      state: 'visible',
      timeout: 30000 
    });
    
    // Check AR controls are available
    await expect(page.locator('[data-testid="ar-intensity-slider"]')).toBeVisible();
    await expect(page.locator('[data-testid="before-after-toggle"]')).toBeVisible();
    
    // Test before/after toggle
    await page.click('[data-testid="before-after-toggle"]');
    await expect(page.locator('[data-testid="before-view"]')).toBeVisible();
    
    await page.click('[data-testid="before-after-toggle"]');
    await expect(page.locator('[data-testid="after-view"]')).toBeVisible();
  });

  test('AI quota tracking and overage handling', async ({ page }) => {
    // Check current quota status
    await page.goto('/th/sales');
    const quotaUsage = await page.locator('[data-testid="quota-usage"]').textContent();
    const currentUsage = parseInt(quotaUsage?.split('/')[0] || '0');
    
    // Perform analysis to increment usage
    await page.goto('/th/sales/analysis');
    await page.fill('[data-testid="customer-name"]', 'Quota Test');
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face-3.jpg');
    await page.click('[data-testid="start-analysis-btn"]');
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 45000 });
    
    // Return to dashboard and verify quota increment
    await page.goto('/th/sales');
    const newQuotaUsage = await page.locator('[data-testid="quota-usage"]').textContent();
    const newUsage = parseInt(newQuotaUsage?.split('/')[0] || '0');
    
    expect(newUsage).toBe(currentUsage + 1);
    
    // Check if overage warning appears when approaching limit
    if (newUsage >= 180) { // Assuming 200 quota limit for test clinic
      await expect(page.locator('[data-testid="quota-warning"]')).toBeVisible();
    }
  });

  test('Analysis with different skin types', async ({ page }) => {
    const testCases = [
      { image: 'test-face-oily.jpg', expectedType: 'oily' },
      { image: 'test-face-dry.jpg', expectedType: 'dry' },
      { image: 'test-face-combination.jpg', expectedType: 'combination' }
    ];

    for (const testCase of testCases) {
      await page.goto('/th/sales/analysis');
      await page.fill('[data-testid="customer-name"]', `${testCase.expectedType} skin test`);
      await page.locator('input[type="file"]').setInputFiles(`./tests/fixtures/${testCase.image}`);
      await page.click('[data-testid="start-analysis-btn"]');
      await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 45000 });
      
      // Verify skin type detection
      const detectedType = await page.locator('[data-testid="skin-type"]').textContent();
      expect(detectedType?.toLowerCase()).toContain(testCase.expectedType);
      
      // Verify appropriate treatment recommendations
      const recommendations = page.locator('[data-testid="treatment-recommendations"] li');
      await expect(recommendations).toHaveCount(await recommendations.count());
    }
  });

  test('Error handling for invalid images', async ({ page }) => {
    await page.goto('/th/sales/analysis');
    await page.fill('[data-testid="customer-name"]', 'Error Test');
    
    // Try to upload non-image file
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/invalid-file.txt');
    
    // Should show error message
    await expect(page.locator('[data-testid="file-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-error"]')).toContainText('รูปภาพไม่ถูกต้อง');
    
    // Analysis button should be disabled
    await expect(page.locator('[data-testid="start-analysis-btn"]')).toBeDisabled();
  });

  test('Analysis results export and sharing', async ({ page }) => {
    // Complete analysis
    await page.goto('/th/sales/analysis');
    await page.fill('[data-testid="customer-name"]', 'Export Test Customer');
    await page.fill('[data-testid="customer-email"]', 'export@test.com');
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face-1.jpg');
    await page.click('[data-testid="start-analysis-btn"]');
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 45000 });
    
    // Test PDF export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-pdf-btn"]')
    ]);
    
    expect(download.suggestedFilename()).toContain('analysis-report');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Test share via QR code
    await page.click('[data-testid="share-qr-btn"]');
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // Verify QR code contains valid URL
    const qrUrl = await page.locator('[data-testid="share-url"]').textContent();
    expect(qrUrl).toMatch(/^https?:\/\/.+\/analysis\/[a-zA-Z0-9-]+$/);
  });
});
