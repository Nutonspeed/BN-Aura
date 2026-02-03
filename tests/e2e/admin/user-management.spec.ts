import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'super.admin@bn-aura.com');
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    
    // Navigate to user management
    await page.click('[data-testid="nav-users"]');
    await page.waitForURL('/admin/users');
  });

  test('should display users list with correct data', async ({ page }) => {
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    
    // Check for user rows
    const userRows = page.locator('[data-testid="user-row"]');
    await expect(userRows.first()).toBeVisible();
    
    // Check role badges
    await expect(page.locator('[data-testid="role-badge"]').first()).toBeVisible();
    
    // Check status indicators
    await expect(page.locator('[data-testid="status-indicator"]').first()).toBeVisible();
  });

  test('should filter users by search term', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-users"]');
    await searchInput.fill('admin');
    
    // Wait for search to apply
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const userRows = page.locator('[data-testid="user-row"]');
    const firstRowText = await userRows.first().textContent();
    expect(firstRowText?.toLowerCase()).toContain('admin');
  });

  test('should activate/deactivate user', async ({ page }) => {
    const firstUserRow = page.locator('[data-testid="user-row"]').first();
    const toggleButton = firstUserRow.locator('[data-testid="toggle-status"]');
    
    // Get initial status
    const initialStatus = await firstUserRow.locator('[data-testid="status-indicator"]').textContent();
    
    // Click toggle button
    await toggleButton.click();
    
    // Wait for status to update
    await page.waitForTimeout(1000);
    
    // Verify status changed
    const newStatus = await firstUserRow.locator('[data-testid="status-indicator"]').textContent();
    expect(newStatus).not.toBe(initialStatus);
  });

  test('should show user details modal', async ({ page }) => {
    const firstUserRow = page.locator('[data-testid="user-row"]').first();
    const viewButton = firstUserRow.locator('[data-testid="view-user"]');
    
    await viewButton.click();
    
    // Verify modal appears
    await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-detail-content"]')).toBeVisible();
    
    // Close modal
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="user-detail-modal"]')).not.toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    await page.click('[data-testid="create-user"]');
    
    // Verify create user modal appears
    await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible();
    
    // Fill user form
    await page.fill('[data-testid="user-email"]', 'test.user@example.com');
    await page.fill('[data-testid="user-name"]', 'Test User');
    await page.selectOption('[data-testid="user-role"]', 'free_user');
    
    // Submit form
    await page.click('[data-testid="submit-user"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify user appears in table
    await page.waitForTimeout(1000);
    const searchInput = page.locator('[data-testid="search-users"]');
    await searchInput.fill('test.user@example.com');
    await page.waitForTimeout(500);
    
    const userRows = page.locator('[data-testid="user-row"]');
    const firstRowText = await userRows.first().textContent();
    expect(firstRowText?.toLowerCase()).toContain('test.user@example.com');
  });
});
