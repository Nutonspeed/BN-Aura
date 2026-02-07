import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Smoke Tests — critical API endpoints + POS page load
 */

const CLINIC_OWNER = { email: 'clinic.owner@bntest.com', password: 'BNAura2024!' };

async function loginAsClinicOwner(page: any) {
  await login(page, CLINIC_OWNER.email, CLINIC_OWNER.password);
  await page.waitForURL('**/clinic', { timeout: 15000 });
}

test.describe('Smoke Tests', () => {
  test('exchange rate API returns real rate', async ({ request }) => {
    const res = await request.get('/api/pricing?action=exchange-rate&from=USD&to=THB');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.rate).toBeGreaterThan(0);
    expect(data.from).toBe('USD');
    expect(data.to).toBe('THB');
  });

  test('advanced analytics API returns data', async ({ request }) => {
    const res = await request.get('/api/analytics/advanced');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  test('inventory alerts API responds', async ({ request }) => {
    const res = await request.get('/api/inventory/alerts');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.alerts).toBeDefined();
  });

  test('POS page loads with treatments', async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/th/clinic/pos');
    await page.waitForSelector('text=Point of Sale', { timeout: 20000 });
    const treatments = page.locator('button:has-text("THB")');
    await expect(treatments.first()).toBeVisible({ timeout: 15000 });
  });

  test('POS currency toggle exists', async ({ page }) => {
    await loginAsClinicOwner(page);
    await page.goto('/th/clinic/pos');
    await page.waitForSelector('text=Point of Sale', { timeout: 20000 });
    await expect(page.getByRole('button', { name: 'THB' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'USD' })).toBeVisible();
  });

  test('clinic settings API returns data when authenticated', async ({ page }) => {
    await loginAsClinicOwner(page);
    const res = await page.request.get('/api/clinic/settings');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});
