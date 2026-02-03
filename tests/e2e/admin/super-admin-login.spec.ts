import { test, expect } from '@playwright/test';

test.describe('Super Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'super.admin@bn-aura.com');
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should display main dashboard with correct metrics', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Super Admin Dashboard');
    
    // Check for key dashboard elements
    await expect(page.locator('[data-testid="total-clinics"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-metrics"]')).toBeVisible();
  });

  test('should navigate to user management page', async ({ page }) => {
    await page.click('[data-testid="nav-users"]');
    await page.waitForURL('/admin/users');
    
    await expect(page.locator('h1')).toContainText('User Management');
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-users"]')).toBeVisible();
  });

  test('should navigate to system monitoring page', async ({ page }) => {
    await page.click('[data-testid="nav-system"]');
    await page.waitForURL('/admin/system');
    
    await expect(page.locator('h1')).toContainText('System Monitoring');
    await expect(page.locator('[data-testid="system-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-alerts"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-status"]')).toBeVisible();
  });

  test('should navigate to analytics dashboard', async ({ page }) => {
    await page.click('[data-testid="nav-analytics"]');
    await page.waitForURL('/admin/analytics');
    
    await expect(page.locator('h1')).toContainText('Analytics');
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
  });

  test('should navigate to audit logs page', async ({ page }) => {
    await page.click('[data-testid="nav-audit"]');
    await page.waitForURL('/admin/audit');
    
    await expect(page.locator('h1')).toContainText('Audit Trail');
    await expect(page.locator('[data-testid="audit-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-filters"]')).toBeVisible();
  });

  test('should navigate to support tickets page', async ({ page }) => {
    await page.click('[data-testid="nav-support"]');
    await page.waitForURL('/admin/support');
    
    await expect(page.locator('h1')).toContainText('Support Center');
    await expect(page.locator('[data-testid="tickets-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-filters"]')).toBeVisible();
  });

  test('should navigate to billing page', async ({ page }) => {
    await page.click('[data-testid="nav-billing"]');
    await page.waitForURL('/admin/billing');
    
    await expect(page.locator('h1')).toContainText('Billing Management');
    await expect(page.locator('[data-testid="billing-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscriptions-table"]')).toBeVisible();
  });

  test('should navigate to security page', async ({ page }) => {
    await page.click('[data-testid="nav-security"]');
    await page.waitForURL('/admin/security');
    
    await expect(page.locator('h1')).toContainText('Security');
    await expect(page.locator('[data-testid="security-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-events"]')).toBeVisible();
  });

  test('should navigate to announcements page', async ({ page }) => {
    await page.click('[data-testid="nav-announcements"]');
    await page.waitForURL('/admin/announcements');
    
    await expect(page.locator('h1')).toContainText('Announcements');
    await expect(page.locator('[data-testid="announcements-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-announcement"]')).toBeVisible();
  });

  test('should navigate to network map page', async ({ page }) => {
    await page.click('[data-testid="nav-network-map"]');
    await page.waitForURL('/admin/network-map');
    
    await expect(page.locator('h1')).toContainText('Network Map');
    await expect(page.locator('[data-testid="network-topology"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-stats"]')).toBeVisible();
  });

  test('should navigate to clinics management page', async ({ page }) => {
    await page.click('[data-testid="nav-clinics"]');
    await page.waitForURL('/admin/clinics');
    
    await expect(page.locator('h1')).toContainText('Clinic Management');
    await expect(page.locator('[data-testid="clinics-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="clinic-filters"]')).toBeVisible();
  });

  test('should navigate to permissions page', async ({ page }) => {
    await page.click('[data-testid="nav-permissions"]');
    await page.waitForURL('/admin/permissions');
    
    await expect(page.locator('h1')).toContainText('Permissions');
    await expect(page.locator('[data-testid="roles-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="permissions-matrix"]')).toBeVisible();
  });
});
