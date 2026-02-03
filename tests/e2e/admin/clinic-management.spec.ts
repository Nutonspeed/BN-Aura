import { test, expect } from '@playwright/test';

test.describe('Clinic Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'super.admin@bn-aura.com');
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    
    // Navigate to clinic management
    await page.click('[data-testid="nav-clinics"]');
    await page.waitForURL('/admin/clinics');
  });

  test('should display clinics list with correct data', async ({ page }) => {
    await expect(page.locator('[data-testid="clinics-table"]')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('th:has-text("Clinic")')).toBeVisible();
    await expect(page.locator('th:has-text("Tier")')).toBeVisible();
    await expect(page.locator('th:has-text("Staff")')).toBeVisible();
    await expect(page.locator('th:has-text("Customers")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    
    // Check for clinic rows
    const clinicRows = page.locator('[data-testid="clinic-row"]');
    await expect(clinicRows.first()).toBeVisible();
    
    // Check tier badges
    await expect(page.locator('[data-testid="tier-badge"]').first()).toBeVisible();
    
    // Check status indicators
    await expect(page.locator('[data-testid="status-indicator"]').first()).toBeVisible();
  });

  test('should display clinic statistics cards', async ({ page }) => {
    await expect(page.locator('[data-testid="total-clinics"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-clinics"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-staff"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
  });

  test('should filter clinics by search term', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-clinics"]');
    await searchInput.fill('clinic');
    
    // Wait for search to apply
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const clinicRows = page.locator('[data-testid="clinic-row"]');
    const firstRowText = await clinicRows.first().textContent();
    expect(firstRowText?.toLowerCase()).toContain('clinic');
  });

  test('should filter clinics by tier', async ({ page }) => {
    const tierFilter = page.locator('[data-testid="tier-filter"]');
    await tierFilter.selectOption('starter');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify filtered results show only starter tier
    const tierBadges = page.locator('[data-testid="tier-badge"]');
    for (let i = 0; i < await tierBadges.count(); i++) {
      const badgeText = await tierBadges.nth(i).textContent();
      expect(badgeText?.toLowerCase()).toContain('starter');
    }
  });

  test('should filter clinics by status', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.selectOption('active');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify filtered results show only active clinics
    const statusIndicators = page.locator('[data-testid="status-indicator"]');
    for (let i = 0; i < await statusIndicators.count(); i++) {
      const statusText = await statusIndicators.nth(i).textContent();
      expect(statusText?.toLowerCase()).toContain('active');
    }
  });

  test('should activate/deactivate clinic', async ({ page }) => {
    const firstClinicRow = page.locator('[data-testid="clinic-row"]').first();
    const toggleButton = firstClinicRow.locator('[data-testid="toggle-status"]');
    
    // Get initial status
    const initialStatus = await firstClinicRow.locator('[data-testid="status-indicator"]').textContent();
    
    // Click toggle button
    await toggleButton.click();
    
    // Wait for status to update
    await page.waitForTimeout(1000);
    
    // Verify status changed
    const newStatus = await firstClinicRow.locator('[data-testid="status-indicator"]').textContent();
    expect(newStatus).not.toBe(initialStatus);
  });

  test('should show clinic details modal', async ({ page }) => {
    const firstClinicRow = page.locator('[data-testid="clinic-row"]').first();
    const viewButton = firstClinicRow.locator('[data-testid="view-clinic"]');
    
    await viewButton.click();
    
    // Verify modal appears
    await expect(page.locator('[data-testid="clinic-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="clinic-detail-content"]')).toBeVisible();
    
    // Check for clinic information sections
    await expect(page.locator('[data-testid="clinic-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="clinic-contact"]')).toBeVisible();
    await expect(page.locator('[data-testid="clinic-usage-stats"]')).toBeVisible();
    
    // Close modal
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="clinic-detail-modal"]')).not.toBeVisible();
  });

  test('should create new clinic', async ({ page }) => {
    await page.click('[data-testid="create-clinic"]');
    
    // Verify create clinic modal appears
    await expect(page.locator('[data-testid="create-clinic-modal"]')).toBeVisible();
    
    // Fill clinic form
    await page.fill('[data-testid="clinic-name-th"]', 'คลินิกทดสอบ');
    await page.fill('[data-testid="clinic-name-en"]', 'Test Clinic');
    await page.fill('[data-testid="clinic-code"]', 'TEST001');
    await page.fill('[data-testid="clinic-email"]', 'test@clinic.com');
    await page.fill('[data-testid="clinic-phone"]', '0812345678');
    await page.selectOption('[data-testid="clinic-tier"]', 'starter');
    
    // Submit form
    await page.click('[data-testid="submit-clinic"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify clinic appears in table
    await page.waitForTimeout(1000);
    const searchInput = page.locator('[data-testid="search-clinics"]');
    await searchInput.fill('TEST001');
    await page.waitForTimeout(500);
    
    const clinicRows = page.locator('[data-testid="clinic-row"]');
    const firstRowText = await clinicRows.first().textContent();
    expect(firstRowText?.toLowerCase()).toContain('test001');
  });
});
