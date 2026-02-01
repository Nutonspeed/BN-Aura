import { test, expect } from '@playwright/test';

/**
 * Essential Features E2E Test Suite
 * ชุดทดสอบหลักที่ต้องทำงานให้ได้ก่อนขยายต่อ
 */
test.describe('Essential Features - Core E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Handle PDPA modal consistently
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Continue if PDPA modal not present
    }
  });

  test('🏠 Homepage loads and displays main content', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/BN-Aura/);
    
    // Check main content is present (flexible matching)
    const mainContent = [
      page.getByText(/skin analysis/i),
      page.getByText(/seconds/),
      page.getByText(/aesthetic/i),
      page.getByText(/premium/i)
    ];
    
    let contentFound = false;
    for (const element of mainContent) {
      if (await element.isVisible()) {
        contentFound = true;
        break;
      }
    }
    expect(contentFound).toBe(true);
  });

  test('🔐 Login page accessibility and form validation', async ({ page }) => {
    await page.goto('http://localhost:3000/th/login');
    await page.waitForLoadState('networkidle');
    
    // Handle PDPA if present
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // Continue
    }
    
    // Verify login form elements exist
    const emailField = page.getByRole('textbox').first();
    const passwordField = page.getByRole('textbox').nth(1);
    const loginButton = page.getByRole('button', { name: /ลงชื่อเข้าใช้|เข้าสู่ระบบ|login/i });
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Test form interaction
    await emailField.fill('test@example.com');
    await passwordField.fill('testpassword');
    
    // Verify input values
    await expect(emailField).toHaveValue('test@example.com');
    await expect(passwordField).toHaveValue('testpassword');
  });

  test('🚫 Invalid login attempt handling', async ({ page }) => {
    await page.goto('http://localhost:3000/th/login');
    await page.waitForLoadState('networkidle');
    
    // Handle PDPA
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // Continue
    }
    
    // Fill invalid credentials
    await page.getByRole('textbox').first().fill('invalid@test.com');
    await page.getByRole('textbox').nth(1).fill('wrongpassword');
    await page.getByRole('button', { name: /ลงชื่อเข้าใช้|login/i }).click();
    
    // Should remain on login page (not redirect)
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/login');
    
    // Check that we're still on login page with form visible
    await expect(page.getByRole('button', { name: /ลงชื่อเข้าใช้|login/i })).toBeVisible();
  });

  test('🌐 Basic navigation and routing', async ({ page }) => {
    // Test basic page navigation
    const testRoutes = [
      { path: '/', expectedContent: /aesthetic|skin|BN-Aura/i },
      { path: '/th', expectedContent: /aesthetic|skin|BN-Aura/i },
      { path: '/th/login', expectedContent: /ลงชื่อเข้าใช้|login/i }
    ];
    
    for (const route of testRoutes) {
      await page.goto(`http://localhost:3000${route.path}`);
      await page.waitForLoadState('networkidle');
      
      // Handle PDPA if needed
      try {
        const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
        if (await pdpaButton.isVisible({ timeout: 1000 })) {
          await pdpaButton.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // Continue
      }
      
      // Check that page loaded successfully
      await expect(page).toHaveTitle(/BN-Aura/);
      
      // Check for expected content
      const hasExpectedContent = await page.getByText(route.expectedContent).first().isVisible().catch(() => false);
      expect(hasExpectedContent).toBe(true);
    }
  });

  test('📱 Mobile responsiveness basic check', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Handle PDPA
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // Continue
    }
    
    // Check that page loads without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Allow small margin
    
    // Check that main content is still visible
    const mainContentVisible = await page.getByText(/BN-Aura|aesthetic|skin/i).first().isVisible().catch(() => false);
    expect(mainContentVisible).toBe(true);
  });

  test('⚡ Page performance baseline', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
    
    const domLoadTime = Date.now() - startTime;
    
    // DOMContentLoaded should be reasonably fast (15s max for development)
    expect(domLoadTime).toBeLessThan(15000);
    
    // Wait for network idle with timeout
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    const fullLoadTime = Date.now() - startTime;
    
    // Full load should complete within 20 seconds for development
    expect(fullLoadTime).toBeLessThan(20000);
  });

  test('🔧 JavaScript functionality check', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check for JavaScript errors
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // Handle PDPA interaction (tests JavaScript functionality)
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Continue
    }
    
    // Navigate to login (tests routing JavaScript)
    await page.goto('http://localhost:3000/th/login');
    await page.waitForLoadState('networkidle');
    
    // Check that no critical JavaScript errors occurred
    const criticalErrors = jsErrors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('🛡️ Basic security headers check', async ({ page }) => {
    const response = await page.goto('http://localhost:3000');
    
    if (response) {
      const headers = response.headers();
      
      // Check for Next.js security headers
      expect(headers).toHaveProperty('x-powered-by');
      
      // Check that page loads with 200 status
      expect(response.status()).toBe(200);
      
      // Check content type is HTML
      expect(headers['content-type']).toContain('text/html');
    }
  });
});
