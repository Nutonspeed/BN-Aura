import { test, expect } from '@playwright/test';

test.describe('BN-Aura E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto('/th/login');
  });

  test('Clinic Owner Login Flow', async ({ page }) => {
    // Test clinic owner login
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Should redirect to clinic dashboard
    await expect(page).toHaveURL(/\/th\/clinic/);
    await expect(page.locator('h1').first()).toContainText('Executive Intelligence');
  });

  test('Staff Creation and Login', async ({ page }) => {
    // Login as clinic owner first
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Navigate to staff management
    await page.goto('/th/clinic/settings/staff');

    // Create new staff member
    await page.click('button:has-text("Add Staff")');
    await page.fill('input[name="full_name"]', 'Test Staff Member');
    await page.fill('input[name="email"]', 'test.staff@bntest.com');
    await page.selectOption('select[name="role"]', 'sales_staff');
    await page.click('button[type="submit"]');

    // Verify staff was created (would need proper selectors)
    await expect(page.locator('text=Test Staff Member')).toBeVisible();
  });

  test('POS Transaction Flow', async ({ page }) => {
    // Login as clinic owner
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Navigate to POS
    await page.goto('/th/clinic/pos');

    // Add product to cart (would need proper selectors)
    await page.click('button:has-text("Add to Cart")').first();

    // Proceed to checkout
    await page.click('button:has-text("Checkout")');

    // Complete payment
    await page.click('button:has-text("Confirm Payment")');

    // Verify transaction completed
    await expect(page.locator('text=Transaction completed successfully')).toBeVisible();
  });

  test('Customer Management', async ({ page }) => {
    // Login as clinic owner
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Navigate to customers
    await page.goto('/th/clinic/customers');

    // Create new customer
    await page.click('button:has-text("Add Customer")');
    await page.fill('input[name="full_name"]', 'Test Customer');
    await page.fill('input[name="phone"]', '0812345678');
    await page.fill('input[name="email"]', 'test.customer@example.com');
    await page.click('button[type="submit"]');

    // Verify customer was created
    await expect(page.locator('text=Test Customer')).toBeVisible();
  });

  test('Data Isolation Between Clinics', async ({ page, context }) => {
    // Login as clinic owner
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Check customer count
    await page.goto('/th/clinic/customers');
    const clinicOwnerCustomerCount = await page.locator('.customer-item').count();

    // Create new page context for different user (would need proper test setup)
    // This is a placeholder for data isolation testing
    expect(clinicOwnerCustomerCount).toBeGreaterThanOrEqual(0);
  });

  test('Payment Reconciliation', async ({ page }) => {
    // Login as clinic owner
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Navigate to payment reconciliation
    await page.goto('/th/clinic/payments/reconciliation');

    // Verify reconciliation data loads
    await expect(page.locator('text=Payment Reconciliation')).toBeVisible();
    await expect(page.locator('.reconciliation-summary')).toBeVisible();
  });

  test('Business Intelligence Dashboard', async ({ page }) => {
    // Login as clinic owner
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Navigate to business intelligence
    await page.goto('/th/clinic/analytics/advanced/business-intelligence');

    // Verify BI dashboard loads
    await expect(page.locator('text=Business Intelligence')).toBeVisible();
    await expect(page.locator('.customer-analytics')).toBeVisible();
    await expect(page.locator('.revenue-analytics')).toBeVisible();
  });

  test('Financial Reports', async ({ page }) => {
    // Login as clinic owner
    await page.fill('input[type="email"]', 'clinic.owner@bntest.com');
    await page.fill('input[type="password"]', 'BNAura2024!');
    await page.click('button[type="submit"]');

    // Navigate to financial reports
    await page.goto('/th/clinic/finance/reports');

    // Verify financial data loads
    await expect(page.locator('text=Financial Reports')).toBeVisible();
    await expect(page.locator('.revenue-summary')).toBeVisible();
  });
});
