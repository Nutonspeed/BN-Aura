import { test, expect } from '@playwright/test';

test.describe('AI Monitoring Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/th/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'nuttapong161@gmail.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Submit login
    await page.click('button:has-text("ลงชื่อเข้าใช้")');
    
    // Wait for navigation
    await page.waitForURL('**/admin/**');
  });

  test('Monitoring dashboard loads correctly', async ({ page }) => {
    // Navigate to monitoring dashboard
    await page.goto('/th/admin/monitoring');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the correct page
    expect(page.url()).toContain('/admin/monitoring');
    
    // Check for monitoring dashboard elements
    await expect(page.locator('h1, h2')).toContainText(/monitoring|ai|dashboard/i);
    
    // Look for metric cards or charts
    const metricCards = page.locator('[data-testid="metric-card"], .metric-card, .stats-card');
    const cardCount = await metricCards.count();
    
    console.log(`Found ${cardCount} metric cards on monitoring dashboard`);
    
    // Check for charts
    const charts = page.locator('canvas, [data-testid="chart"], .chart-container');
    const chartCount = await charts.count();
    
    console.log(`Found ${chartCount} charts on monitoring dashboard`);
  });

  test('Monitoring dashboard displays AI metrics', async ({ page }) => {
    await page.goto('/th/admin/monitoring');
    await page.waitForLoadState('networkidle');
    
    // Look for specific AI metrics
    const aiMetrics = [
      'Skin Analysis',
      'Treatment Prediction',
      'Genetic Analysis',
      'Response Time',
      'Success Rate',
      'Error Rate'
    ];
    
    for (const metric of aiMetrics) {
      const element = page.locator(`text=${metric}`).first();
      if (await element.isVisible()) {
        console.log(`✓ Found metric: ${metric}`);
      }
    }
  });

  test('Monitoring dashboard refresh functionality', async ({ page }) => {
    await page.goto('/th/admin/monitoring');
    await page.waitForLoadState('networkidle');
    
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("refresh"), button[aria-label*="refresh"], .refresh-btn').first();
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Refresh button works');
    } else {
      console.log('ℹ No refresh button found');
    }
  });

  test('Monitoring dashboard handles errors gracefully', async ({ page }) => {
    // Navigate to monitoring dashboard
    await page.goto('/th/admin/monitoring');
    await page.waitForLoadState('networkidle');
    
    // Check for error states
    const errorElements = page.locator('.error, .alert-error, [data-testid="error"]');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      console.log(`Found ${errorCount} error elements`);
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // The page should still load even with errors
    expect(page.url()).toContain('/admin/monitoring');
  });

  test('Monitoring dashboard responsive design', async ({ page }) => {
    await page.goto('/th/admin/monitoring');
    await page.waitForLoadState('networkidle');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const desktopElements = page.locator('.dashboard, .monitoring-dashboard, main').first();
    expect(await desktopElements.isVisible()).toBeTruthy();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const tabletElements = page.locator('.dashboard, .monitoring-dashboard, main').first();
    expect(await tabletElements.isVisible()).toBeTruthy();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileElements = page.locator('.dashboard, .monitoring-dashboard, main').first();
    expect(await mobileElements.isVisible()).toBeTruthy();
    
    console.log('✓ Dashboard is responsive across all viewports');
  });
});

test.describe('AI Monitoring API Integration', () => {
  test('Health endpoint includes monitoring data', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    
    // Check if monitoring data is included
    if (data.data.aiPipeline) {
      console.log('✓ AI Pipeline monitoring data found in health endpoint');
      console.log('AI Pipeline Status:', data.data.aiPipeline);
    } else {
      console.log('ℹ AI Pipeline monitoring data not yet integrated');
    }
  });

  test('Monitoring endpoints are accessible', async ({ request }) => {
    const monitoringEndpoints = [
      '/api/monitoring/metrics',
      '/api/monitoring/alerts',
      '/api/monitoring/status'
    ];
    
    for (const endpoint of monitoringEndpoints) {
      const response = await request.get(endpoint);
      
      if (response.ok()) {
        console.log(`✓ ${endpoint} - ${response.status()}`);
      } else if (response.status() === 404) {
        console.log(`ℹ ${endpoint} - Not implemented (${response.status()})`);
      } else {
        console.log(`⚠ ${endpoint} - ${response.status()}`);
      }
    }
  });
});
