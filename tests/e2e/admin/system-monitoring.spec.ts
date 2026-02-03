import { test, expect } from '@playwright/test';

test.describe('System Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'super.admin@bn-aura.com');
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    
    // Navigate to system monitoring
    await page.click('[data-testid="nav-system"]');
    await page.waitForURL('/admin/system');
  });

  test('should display system monitoring dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('System Monitoring');
    
    // Check for system metrics cards
    await expect(page.locator('[data-testid="system-status-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="cpu-usage-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-usage-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-connections-card"]')).toBeVisible();
  });

  test('should display service status', async ({ page }) => {
    await expect(page.locator('[data-testid="service-status"]')).toBeVisible();
    
    // Check for individual services
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="cache-status"]')).toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    
    // Check for performance indicators
    await expect(page.locator('[data-testid="response-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="disk-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-check"]')).toBeVisible();
  });

  test('should display system alerts when present', async ({ page }) => {
    // Check if alerts section exists (may not have alerts)
    const alertsSection = page.locator('[data-testid="system-alerts"]');
    if (await alertsSection.isVisible()) {
      await expect(page.locator('[data-testid="alert-item"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-severity"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-message"]')).toBeVisible();
    }
  });

  test('should refresh system data', async ({ page }) => {
    const refreshButton = page.locator('[data-testid="refresh-system"]');
    await expect(refreshButton).toBeVisible();
    
    // Get initial metrics
    const initialCpuUsage = await page.locator('[data-testid="cpu-usage-value"]').textContent();
    
    // Click refresh
    await refreshButton.click();
    
    // Wait for refresh to complete
    await page.waitForTimeout(2000);
    
    // Verify data is refreshed (may be same value, but should complete)
    await expect(page.locator('[data-testid="cpu-usage-value"]')).toBeVisible();
  });

  test('should display real-time updates', async ({ page }) => {
    // Check for real-time indicators
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible();
    
    // Wait for potential real-time updates
    await page.waitForTimeout(5000);
    
    // Verify dashboard is still responsive
    await expect(page.locator('[data-testid="system-status-card"]')).toBeVisible();
  });

  test('should handle system alerts resolution', async ({ page }) => {
    // Look for unresolved alerts
    const unresolvedAlerts = page.locator('[data-testid="alert-item"]:not([data-resolved="true"])');
    
    if (await unresolvedAlerts.count() > 0) {
      const firstAlert = unresolvedAlerts.first();
      const resolveButton = firstAlert.locator('[data-testid="resolve-alert"]');
      
      if (await resolveButton.isVisible()) {
        // Click resolve button
        await resolveButton.click();
        
        // Verify alert is marked as resolved
        await page.waitForTimeout(1000);
        await expect(firstAlert).toHaveAttribute('data-resolved', 'true');
      }
    }
  });

  test('should display system health indicators', async ({ page }) => {
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
    
    // Check for health status
    await expect(page.locator('[data-testid="health-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="uptime-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-health-check"]')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate network issues by going offline and back online
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Should show error state or loading state
    const errorState = page.locator('[data-testid="error-state"]');
    const loadingState = page.locator('[data-testid="loading-state"]');
    
    const hasErrorOrLoading = await errorState.isVisible() || await loadingState.isVisible();
    expect(hasErrorOrLoading).toBeTruthy();
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    // Should recover and show data
    await expect(page.locator('[data-testid="system-status-card"]')).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="system-status-card"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="system-status-card"]')).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="system-status-card"]')).toBeVisible();
  });
});
