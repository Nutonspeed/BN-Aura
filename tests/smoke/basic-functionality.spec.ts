import { test, expect } from '@playwright/test';

test.describe('Basic Functionality - Smoke Tests', () => {
  
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Should show BN-Aura homepage
    await expect(page).toHaveTitle(/BN-Aura/);
    await expect(page.getByText(/Premium Aesthetic Intelligence|skin analysis happens in seconds/i)).toBeVisible();
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/th/login');
    await page.waitForLoadState('networkidle');
    
    // Handle PDPA modal if present
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // PDPA modal not present, continue
    }
    
    // Should show login form
    await expect(page.getByRole('textbox', { name: 'name@clinic.com' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '••••••••' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ลงชื่อเข้าใช้' })).toBeVisible();
  });

  test('Demo page is accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/th/demo');
    await page.waitForLoadState('networkidle');
    
    // Should load demo page without errors
    await expect(page).toHaveTitle(/BN-Aura/);
    
    // Check for demo-related content
    const demoElements = [
      page.getByText(/demo/i),
      page.getByText(/ทดลอง/i),
      page.getByText(/magic scan/i),
      page.getByText(/สแกน/i)
    ];
    
    // At least one demo-related element should be visible
    let demoVisible = false;
    for (const element of demoElements) {
      if (await element.isVisible()) {
        demoVisible = true;
        break;
      }
    }
    expect(demoVisible).toBeTruthy();
  });

  test('Invalid login shows error handling', async ({ page }) => {
    await page.goto('http://localhost:3000/th/login');
    await page.waitForLoadState('networkidle');
    
    // Handle PDPA modal if present
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // PDPA modal not present, continue
    }
    
    // Try invalid login
    await page.getByRole('textbox', { name: 'name@clinic.com' }).fill('invalid@test.com');
    await page.getByRole('textbox', { name: '••••••••' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
    
    // Should stay on login page or show error
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('Navigation and routing work correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Test navigation to demo page
    const demoLink = page.getByRole('link', { name: /ทดลองใช้|demo/i }).first();
    if (await demoLink.isVisible()) {
      await demoLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/demo');
    }
    
    // Test navigation to login
    await page.goto('http://localhost:3000');
    const loginLink = page.getByRole('link', { name: /เข้าสู่ระบบ|login/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/login');
    }
  });
});
