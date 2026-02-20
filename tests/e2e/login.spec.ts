import { test, expect } from '@playwright/test';

const USERS = {
  sales: { email: 'sales@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/sales' },
  owner: { email: 'owner@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/clinic' },
  beautician: { email: 'beauty@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/beautician' },
  admin: { email: 'superadmin@bnaura.com', password: 'Siam$Aura9x!2026', expectedPath: '/th/admin' }
};

test.describe('BN-Aura Login E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for clean test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('landing page loads correctly', async ({ page }) => {
    await page.goto('https://bn-aura.vercel.app');
    
    // Check page loads
    await expect(page).toHaveTitle(/BN-Aura/);
    await expect(page.locator('h1')).toContainText('skin analysis happens in seconds');
    
    // Check no console errors
    const errors = await page.evaluate(() => {
      return (window as any).__consoleErrors || [];
    });
    expect(errors).toHaveLength(0);
  });

  test('navigation to login page', async ({ page }) => {
    await page.goto('https://bn-aura.vercel.app');
    
    // Click login button
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/th\/login/);
    
    // Check login form elements
    await expect(page.getByRole('textbox', { name: 'name@clinic.com' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '••••••••' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ลงชื่อเข้าใช้' })).toBeVisible();
  });

  Object.entries(USERS).forEach(([role, user]) => {
    test(`successful login for ${role} role`, async ({ page }) => {
      await page.goto('https://bn-aura.vercel.app/th/login');
      
      // Fill login form
      await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(user.email);
      await page.getByRole('textbox', { name: '••••••••' }).fill(user.password);
      await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
      
      // Wait for redirect
      await page.waitForURL(user.expectedPath, { timeout: 20000 });
      await expect(page).toHaveURL(user.expectedPath);
      
      // Wait for dashboard to load
      await page.waitForTimeout(8000);
      
      // Check no console errors
      const errors = await page.evaluate(() => {
        return (window as any).__consoleErrors || [];
      });
      expect(errors).toHaveLength(0);
      
      // Check dashboard elements
      await expect(page.locator('h1')).toBeVisible();
      
      // Check bottom navigation for mobile
      const bottomNav = page.locator('nav.fixed');
      if (await bottomNav.isVisible()) {
        const navLinks = bottomNav.locator('a[href]');
        expect(await navLinks.count()).toBeGreaterThan(0);
      }
    });
  });

  test('invalid login credentials', async ({ page }) => {
    await page.goto('https://bn-aura.vercel.app/th/login');
    
    // Try invalid credentials
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill('invalid@test.com');
    await page.getByRole('textbox', { name: '••••••••' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    
    // Should stay on login page (no redirect)
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/\/th\/login/);
  });

  test('role-based routing verification', async ({ page }) => {
    for (const [role, user] of Object.entries(USERS)) {
      // Clear storage and login
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.goto('https://bn-aura.vercel.app/th/login');
      await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(user.email);
      await page.getByRole('textbox', { name: '••••••••' }).fill(user.password);
      await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
      
      await page.waitForURL(user.expectedPath, { timeout: 20000 });
      await page.waitForTimeout(8000);
      
      // Verify role-specific content
      switch (role) {
        case 'sales':
          await expect(page.locator('text=Dashboard Sales')).toBeVisible();
          break;
        case 'owner':
          await expect(page.locator('text=Dashboard Clinic')).toBeVisible();
          break;
        case 'beautician':
          await expect(page.locator('text=Dashboard Beautician')).toBeVisible();
          break;
        case 'admin':
          await expect(page.locator('text=Dashboard Admin')).toBeVisible();
          break;
      }
    }
  });
});
