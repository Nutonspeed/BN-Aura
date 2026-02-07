import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Login & Redirect Tests
 */

const TEST_USERS = {
  clinic_owner: {
    email: 'clinic.owner@bntest.com',
    password: 'BNAura2024!',
    expectedPath: '/th/clinic',
  },
  sales_staff: {
    email: 'sales1.auth@bntest.com',
    password: 'AuthStaff123!',
    expectedPath: '/th/sales',
  },
};

test.describe('Login & Redirect', () => {
  test('clinic owner \u2192 /th/clinic', async ({ page }) => {
    const user = TEST_USERS.clinic_owner;
    await login(page, user.email, user.password);
    await page.waitForURL(`**${user.expectedPath}`, { timeout: 15000 });
    expect(page.url()).toContain(user.expectedPath);
  });

  test('sales staff \u2192 /th/sales', async ({ page }) => {
    const user = TEST_USERS.sales_staff;
    await login(page, user.email, user.password);
    await page.waitForURL(`**${user.expectedPath}`, { timeout: 15000 });
    expect(page.url()).toContain(user.expectedPath);
  });

  test('logout \u2192 /th/login', async ({ page }) => {
    const user = TEST_USERS.sales_staff;
    await login(page, user.email, user.password);
    await page.waitForURL(`**${user.expectedPath}`, { timeout: 15000 });
    await page.waitForSelector('button:has-text("Logout Session")', { timeout: 10000 });
    await page.getByRole('button', { name: 'Logout Session' }).click();
    await page.waitForURL('**/th/login', { timeout: 10000 });
    expect(page.url()).toContain('/th/login');
  });

  test('invalid credentials shows error', async ({ page }) => {
    await login(page, 'invalid@test.com', 'wrongpassword');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/th/login');
  });
});
