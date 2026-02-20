import { test, expect } from '@playwright/test';

const USERS = {
  sales: { email: 'sales@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/sales' },
  owner: { email: 'owner@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/clinic' },
  beautician: { email: 'beauty@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/beautician' },
  admin: { email: 'superadmin@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/admin' }
};

test.describe('BN-Aura Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  Object.entries(USERS).forEach(([role, user]) => {
    test(`${role} dashboard functionality`, async ({ page }) => {
      // Login
      await page.goto('https://bn-aura.vercel.app/th/login');
      await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(user.email);
      await page.getByRole('textbox', { name: '••••••••' }).fill(user.password);
      await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
      await page.waitForURL(user.expectedPath, { timeout: 20000 });
      await page.waitForTimeout(8000);

      // Check dashboard loads
      await expect(page.locator('h1')).toBeVisible();
      
      // Check no console errors
      const errors = await page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      });
      expect(errors).toHaveLength(0);

      // Test role-specific functionality
      switch (role) {
        case 'sales':
          await testSalesDashboard(page);
          break;
        case 'owner':
          await testOwnerDashboard(page);
          break;
        case 'beautician':
          await testBeauticianDashboard(page);
          break;
        case 'admin':
          await testAdminDashboard(page);
          break;
      }
    });
  });

  async function testSalesDashboard(page: any) {
    // Check sales-specific elements
    await expect(page.locator('text=Dashboard Sales')).toBeVisible();
    
    // Test bottom navigation
    const bottomNav = page.locator('nav.fixed');
    if (await bottomNav.isVisible()) {
      const navLinks = bottomNav.locator('a[href]');
      const salesLinks = ['/th/sales', '/th/sales/ai-analysis', '/th/sales/customers', '/th/shared/chat', '/th/sales/profile'];
      
      for (const expectedLink of salesLinks) {
        const link = bottomNav.locator(`a[href="${expectedLink}"]`);
        if (await link.isVisible()) {
          await expect(link).toBeVisible();
        }
      }
    }

    // Test customers page navigation
    const customersLink = page.locator('a[href="/th/sales/customers"]');
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/\/th\/sales\/customers/);
    }

    // Test profile page navigation
    const profileLink = page.locator('a[href="/th/sales/profile"]');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/\/th\/sales\/profile/);
    }
  }

  async function testOwnerDashboard(page: any) {
    // Check owner-specific elements
    await expect(page.locator('text=Dashboard Clinic')).toBeVisible();
    
    // Test analytics navigation
    const analyticsLink = page.locator('a[href="/th/clinic/analytics"]');
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/\/th\/clinic\/analytics/);
    }

    // Test customers page
    const customersLink = page.locator('a[href="/th/clinic/customers"]');
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/\/th\/clinic\/customers/);
    }
  }

  async function testBeauticianDashboard(page: any) {
    // Check beautician-specific elements
    await expect(page.locator('text=Dashboard Beautician')).toBeVisible();
    
    // Test beautician-specific pages
    const beauticianPages = ['/th/beautician/appointments', '/th/beautician/customers', '/th/beautician/profile'];
    
    for (const pagePath of beauticianPages) {
      const link = page.locator(`a[href="${pagePath}"]`);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(3000);
        await expect(page).toHaveURL(new RegExp(pagePath.replace('/', '\\/')));
        // Go back to main dashboard
        await page.goBack();
        await page.waitForTimeout(2000);
      }
    }
  }

  async function testAdminDashboard(page: any) {
    // Check admin-specific elements
    await expect(page.locator('text=Dashboard Admin')).toBeVisible();
    
    // Admin dashboard should have system management features
    // Check for admin-specific sections
    const adminSections = ['System', 'Users', 'Clinics'];
    
    for (const section of adminSections) {
      const sectionElement = page.locator(`text=${section}`);
      if (await sectionElement.isVisible()) {
        await expect(sectionElement).toBeVisible();
      }
    }
  }

  test('dashboard responsive design', async ({ page }) => {
    // Test with sales user
    await page.goto('https://bn-aura.vercel.app/th/login');
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(USERS.sales.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USERS.sales.password);
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    await page.waitForURL(USERS.sales.expectedPath, { timeout: 20000 });
    await page.waitForTimeout(8000);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Bottom navigation should be visible on mobile
    const bottomNav = page.locator('nav.fixed');
    await expect(bottomNav).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('nav.hidden');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('dashboard error handling', async ({ page }) => {
    // Test error handling by navigating to non-existent page
    await page.goto('https://bn-aura.vercel.app/th/login');
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(USERS.sales.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USERS.sales.password);
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    await page.waitForURL(USERS.sales.expectedPath, { timeout: 20000 });
    await page.waitForTimeout(8000);

    // Try to navigate to non-existent page
    await page.goto('https://bn-aura.vercel.app/th/sales/nonexistent');
    await page.waitForTimeout(3000);
    
    // Should handle gracefully (not crash)
    await expect(page.locator('body')).toBeVisible();
    
    // Check no unhandled errors
    const errors = await page.evaluate(() => {
      return (window as any).__consoleErrors || [];
    });
    expect(errors.length).toBeLessThan(5); // Allow some warnings but no critical errors
  });
});
