import { test, expect } from '@playwright/test';

const USERS = {
  sales: { email: 'sales@bnaura.com', password: 'Siam$Aura9x!2026', basePath: '/th/sales' },
  owner: { email: 'owner@bnaura.com', password: 'Siam$Aura9x!2026', basePath: '/th/clinic' },
  beautician: { email: 'beauty@bnaura.com', password: 'Siam$Aura9x!2026', basePath: '/th/beautician' },
  admin: { email: 'superadmin@bnaura.com', password: 'Siam$Aura9x!2026', basePath: '/th/admin' }
};

test.describe('BN-Aura Navigation & Routing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('protected routes require authentication', async ({ page }) => {
    const protectedRoutes = [
      '/th/sales',
      '/th/clinic',
      '/th/beautician',
      '/th/admin',
      '/th/sales/customers',
      '/th/clinic/customers',
      '/th/beautician/appointments'
    ];

    for (const route of protectedRoutes) {
      // Try to access protected route without login
      await page.goto(`https://bn-aura.vercel.app${route}`);
      await page.waitForTimeout(3000);
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/th\/login/);
    }
  });

  Object.entries(USERS).forEach(([role, user]) => {
    test(`${role} role navigation access control`, async ({ page }) => {
      // Login as user
      await page.goto('https://bn-aura.vercel.app/th/login');
      await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(user.email);
      await page.getByRole('textbox', { name: '••••••••' }).fill(user.password);
      await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
      await page.waitForURL(user.basePath, { timeout: 20000 });
      await page.waitForTimeout(8000);

      // Test role-specific navigation
      switch (role) {
        case 'sales':
          await testSalesNavigation(page);
          break;
        case 'owner':
          await testOwnerNavigation(page);
          break;
        case 'beautician':
          await testBeauticianNavigation(page);
          break;
        case 'admin':
          await testAdminNavigation(page);
          break;
      }
    });
  });

  async function testSalesNavigation(page: any) {
    const salesRoutes = [
      { path: '/th/sales', name: 'Sales Dashboard' },
      { path: '/th/sales/customers', name: 'Sales Customers' },
      { path: '/th/sales/profile', name: 'Sales Profile' },
      { path: '/th/sales/ai-analysis', name: 'AI Analysis' }
    ];

    for (const route of salesRoutes) {
      await page.goto(`https://bn-aura.vercel.app${route.path}`);
      await page.waitForTimeout(3000);
      
      // Should load successfully
      await expect(page.locator('h1')).toBeVisible();
      
      // Check no console errors
      const errors = await page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      });
      expect(errors).toHaveLength(0);
    }

    // Test cross-role access prevention
    const restrictedRoutes = [
      '/th/clinic/customers',
      '/th/clinic/analytics',
      '/th/admin/clinics'
    ];

    for (const route of restrictedRoutes) {
      await page.goto(`https://bn-aura.vercel.app${route}`);
      await page.waitForTimeout(3000);
      
      // Should either redirect back to sales dashboard or show access denied
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/th\/sales/);
    }
  }

  async function testOwnerNavigation(page: any) {
    const ownerRoutes = [
      { path: '/th/clinic', name: 'Clinic Dashboard' },
      { path: '/th/clinic/customers', name: 'Clinic Customers' },
      { path: '/th/clinic/analytics', name: 'Clinic Analytics' }
    ];

    for (const route of ownerRoutes) {
      await page.goto(`https://bn-aura.vercel.app${route.path}`);
      await page.waitForTimeout(3000);
      
      await expect(page.locator('h1')).toBeVisible();
      
      const errors = await page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      });
      expect(errors).toHaveLength(0);
    }
  }

  async function testBeauticianNavigation(page: any) {
    const beauticianRoutes = [
      { path: '/th/beautician', name: 'Beautician Dashboard' },
      { path: '/th/beautician/appointments', name: 'Appointments' },
      { path: '/th/beautician/customers', name: 'Beautician Customers' },
      { path: '/th/beautician/profile', name: 'Beautician Profile' }
    ];

    for (const route of beauticianRoutes) {
      await page.goto(`https://bn-aura.vercel.app${route.path}`);
      await page.waitForTimeout(3000);
      
      await expect(page.locator('h1')).toBeVisible();
      
      const errors = await page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      });
      expect(errors).toHaveLength(0);
    }
  }

  async function testAdminNavigation(page: any) {
    const adminRoutes = [
      { path: '/th/admin', name: 'Admin Dashboard' }
    ];

    for (const route of adminRoutes) {
      await page.goto(`https://bn-aura.vercel.app${route.path}`);
      await page.waitForTimeout(3000);
      
      await expect(page.locator('h1')).toBeVisible();
      
      const errors = await page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      });
      expect(errors).toHaveLength(0);
    }
  }

  test('bottom navigation functionality', async ({ page }) => {
    // Test with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login as sales user
    await page.goto('https://bn-aura.vercel.app/th/login');
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(USERS.sales.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USERS.sales.password);
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    await page.waitForURL(USERS.sales.basePath, { timeout: 20000 });
    await page.waitForTimeout(8000);

    // Test bottom navigation links
    const bottomNav = page.locator('nav.fixed');
    await expect(bottomNav).toBeVisible();
    
    const navLinks = bottomNav.locator('a[href]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Test each navigation link
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      
      if (href && href.startsWith('/th/sales')) {
        await link.click();
        await page.waitForTimeout(3000);
        await expect(page).toHaveURL(new RegExp(href.replace('/', '\\/')));
        
        // Verify page loads without errors
        await expect(page.locator('h1')).toBeVisible();
        
        const errors = await page.evaluate(() => {
          return (window as any).__consoleErrors || [];
        });
        expect(errors).toHaveLength(0);
      }
    }
  });

  test('session persistence across navigation', async ({ page }) => {
    // Login as sales user
    await page.goto('https://bn-aura.vercel.app/th/login');
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(USERS.sales.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USERS.sales.password);
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    await page.waitForURL(USERS.sales.basePath, { timeout: 20000 });
    await page.waitForTimeout(8000);

    // Navigate to different pages
    await page.goto('https://bn-aura.vercel.app/th/sales/customers');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/th\/sales\/customers/);

    // Navigate back to dashboard
    await page.goto('https://bn-aura.vercel.app/th/sales');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/th\/sales/);

    // Should still be logged in (no redirect to login)
    await expect(page).not.toHaveURL(/\/th\/login/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('logout and redirect', async ({ page }) => {
    // Login as sales user
    await page.goto('https://bn-aura.vercel.app/th/login');
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(USERS.sales.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USERS.sales.password);
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    await page.waitForURL(USERS.sales.basePath, { timeout: 20000 });
    await page.waitForTimeout(8000);

    // Find and click logout button
    const logoutButton = page.locator('button').filter({ hasText: /ออกจากระบบ|logout|sign out/i }).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(3000);
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/th\/login/);
      
      // Try to access protected route
      await page.goto('https://bn-aura.vercel.app/th/sales');
      await page.waitForTimeout(3000);
      
      // Should redirect back to login
      await expect(page).toHaveURL(/\/th\/login/);
    }
  });

  test('URL parameter handling', async ({ page }) => {
    // Test with URL parameters
    await page.goto('https://bn-aura.vercel.app/th/login?redirect=/th/sales/customers');
    await page.waitForTimeout(3000);
    
    // Login
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(USERS.sales.email);
    await page.getByRole('textbox', { name: '••••••••' }).fill(USERS.sales.password);
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    await page.waitForTimeout(8000);
    
    // Should handle redirect parameter correctly
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/th\/sales/);
  });
});
