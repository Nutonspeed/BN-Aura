import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Data Isolation Tests (RLS enforcement)
 */

const SALES1 = { email: 'sales1.auth@bntest.com', password: 'AuthStaff123!' };
const SALES2 = { email: 'sales2.auth@bntest.com', password: 'AuthStaff456!' };

async function loginAndGetCustomers(page: any, email: string, password: string) {
  await login(page, email, password);
  await page.waitForURL('**/sales', { timeout: 15000 });
  const response = await page.request.get('/api/customers?limit=100');
  return await response.json();
}

test.describe('Data Isolation (RLS)', () => {
  test('sales1 sees only their assigned customers', async ({ page }) => {
    const data = await loginAndGetCustomers(page, SALES1.email, SALES1.password);
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    const salesIds = new Set(data.data.map((c: any) => c.assigned_sales_id));
    expect(salesIds.size).toBe(1);
  });

  test('sales2 sees only their assigned customers (or none)', async ({ page }) => {
    const data = await loginAndGetCustomers(page, SALES2.email, SALES2.password);
    expect(data.success).toBe(true);
    if (data.data.length > 0) {
      const salesIds = new Set(data.data.map((c: any) => c.assigned_sales_id));
      expect(salesIds.size).toBe(1);
    }
  });

  test('sales1 and sales2 customer sets do not overlap', async ({ browser, baseURL }) => {
    const ctx1 = await browser.newContext({ baseURL });
    const page1 = await ctx1.newPage();
    const data1 = await loginAndGetCustomers(page1, SALES1.email, SALES1.password);
    await ctx1.close();

    const ctx2 = await browser.newContext({ baseURL });
    const page2 = await ctx2.newPage();
    const data2 = await loginAndGetCustomers(page2, SALES2.email, SALES2.password);
    await ctx2.close();

    const ids1 = new Set(data1.data.map((c: any) => c.id));
    const ids2 = new Set(data2.data.map((c: any) => c.id));
    for (const id of ids2) {
      expect(ids1.has(id)).toBe(false);
    }
  });
});
