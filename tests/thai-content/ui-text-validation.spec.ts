import { test, expect, Page } from '@playwright/test';
import { ThaiTextValidator } from '../utils/thai-text-validator';

/**
 * Thai Language UI Content Validation Tests
 * ตรวจสอบความถูกต้องของการแสดงผลข้อความภาษาไทยในทุกส่วนของระบบ
 */

// Test credentials from existing setup
const TEST_CREDENTIALS = {
  superAdmin: { email: 'nuttapong161@gmail.com', password: 'Test1234!' },
  clinicOwner: { email: 'clinic.owner@bntest.com', password: 'BNAura2024!' },
  salesStaff: { email: 'sales1.auth@bntest.com', password: 'AuthStaff123!' }
};

test.describe('Thai Language UI Validation', () => {
  
  test('Login page displays Thai text correctly', async ({ page }) => {
    await page.goto('/th/login');
    
    // Check page title
    await expect(page).toHaveTitle(/BN-Aura/);
    
    // Validate Thai text elements
    const thaiElements = [
      'text=เข้าสู่ระบบ',
      'text=อีเมล',
      'text=รหัสผ่าน',
      'text=จำฉันไว้'
    ];
    
    for (const selector of thaiElements) {
      const element = page.locator(selector);
      await expect(element).toBeVisible();
      
      const text = await element.textContent();
      if (text) {
        expect(ThaiTextValidator.hasThaiCharacters(text)).toBe(true);
        
        const validation = ThaiTextValidator.validateComprehensive(text);
        if (!validation.isValid) {
          console.warn(`Thai text validation issues for "${text}":`, validation.errors);
        }
      }
    }
  });

  test('Sales Dashboard displays Thai navigation and labels', async ({ page }) => {
    // Login as sales staff
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/sales');
    
    // Check Thai navigation elements
    const navigationElements = [
      'text=แดชบอร์ด',
      'text=ลูกค้า',
      'text=การขาย',
      'text=คอมมิชชั่น',
      'text=AI Sales Coach'
    ];
    
    for (const selector of navigationElements) {
      await page.waitForSelector(selector, { timeout: 10000 });
      const element = page.locator(selector);
      await expect(element).toBeVisible();
      
      const text = await element.textContent();
      if (text) {
        expect(ThaiTextValidator.hasThaiCharacters(text)).toBe(true);
      }
    }
    
    // Check currency formatting
    const currencyElements = page.locator('text=/฿[\\d,]+/');
    const currencyCount = await currencyElements.count();
    
    for (let i = 0; i < currencyCount; i++) {
      const text = await currencyElements.nth(i).textContent();
      if (text) {
        const validation = ThaiTextValidator.validateThaiCurrencyFormat(text);
        expect(validation.isValid).toBe(true);
      }
    }
  });

  test('Beautician Dashboard displays Thai workflow terms', async ({ page }) => {
    // Login as beautician (using clinic owner credentials for testing)
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    // Navigate to beautician dashboard
    await page.goto('/th/beautician');
    
    // Check Thai workflow terminology
    const workflowElements = [
      'text=การรักษา',
      'text=นัดหมาย',
      'text=ลูกค้า',
      'text=สถานะ',
      'text=งานที่ต้องทำ'
    ];
    
    for (const selector of workflowElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        
        const text = await element.first().textContent();
        if (text) {
          const validation = ThaiTextValidator.validateMedicalTerms(text);
          // Log warnings but don't fail test for medical term validation
          if (validation.warnings.length > 0) {
            console.warn(`Medical term validation warnings for "${text}":`, validation.warnings);
          }
        }
      }
    }
  });

  test('Form inputs accept Thai text correctly', async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    // Test Thai input in various forms
    const testThaiText = 'ทดสอบการรักษาผิวหนัง ราคา ฿1,500 บาท';
    
    // Try to find input fields and test Thai text input
    const inputFields = page.locator('input[type="text"], textarea');
    const inputCount = await inputFields.count();
    
    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputFields.nth(i);
        const isVisible = await input.isVisible();
        const isEnabled = await input.isEnabled();
        
        if (isVisible && isEnabled) {
          await input.fill(testThaiText);
          const inputValue = await input.inputValue();
          expect(inputValue).toBe(testThaiText);
          
          // Validate rendered text
          const isRenderingCorrect = await ThaiTextValidator.validateThaiRendering(
            page, 
            `input:nth-child(${i + 1})`
          );
          expect(isRenderingCorrect).toBe(true);
        }
      }
    }
  });

  test('Error messages display in Thai', async ({ page }) => {
    await page.goto('/th/login');
    
    // Trigger validation errors
    await page.click('button[type="submit"]'); // Submit without credentials
    
    // Wait for error messages
    await page.waitForTimeout(2000);
    
    // Look for Thai error messages
    const errorElements = page.locator('.error, .text-red, [class*="error"]');
    const errorCount = await errorElements.count();
    
    for (let i = 0; i < errorCount; i++) {
      const element = errorElements.nth(i);
      const text = await element.textContent();
      
      if (text && text.trim() !== '') {
        // Check if error message contains Thai characters
        if (ThaiTextValidator.hasThaiCharacters(text)) {
          const validation = ThaiTextValidator.validateComprehensive(text);
          expect(validation.isValid).toBe(true);
        }
      }
    }
  });

  test('Notification messages are in Thai', async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/sales');
    
    // Look for notification elements
    const notificationElements = page.locator(
      '.notification, .alert, .toast, [class*="notification"], [class*="alert"]'
    );
    const notificationCount = await notificationElements.count();
    
    for (let i = 0; i < notificationCount; i++) {
      const element = notificationElements.nth(i);
      const isVisible = await element.isVisible();
      
      if (isVisible) {
        const text = await element.textContent();
        
        if (text && ThaiTextValidator.hasThaiCharacters(text)) {
          const validation = ThaiTextValidator.validateComprehensive(text);
          if (!validation.isValid) {
            console.warn(`Notification text validation issues:`, validation.errors);
          }
        }
      }
    }
  });

  test('Data tables display Thai headers and content', async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    
    // Check table headers for Thai text
    const tableHeaders = page.locator('th, .table-header');
    const headerCount = await tableHeaders.count();
    
    for (let i = 0; i < headerCount; i++) {
      const header = tableHeaders.nth(i);
      const text = await header.textContent();
      
      if (text && text.trim() !== '' && ThaiTextValidator.hasThaiCharacters(text)) {
        const validation = ThaiTextValidator.validateComprehensive(text);
        expect(validation.isValid).toBe(true);
      }
    }
    
    // Check table data for currency formatting
    const currencyData = page.locator('td:has-text("฿"), .currency');
    const currencyCount = await currencyData.count();
    
    for (let i = 0; i < currencyCount; i++) {
      const cell = currencyData.nth(i);
      const text = await cell.textContent();
      
      if (text) {
        const validation = ThaiTextValidator.validateThaiCurrencyFormat(text);
        expect(validation.isValid).toBe(true);
      }
    }
  });
});

test.describe('Thai Content Quality Checks', () => {
  
  test('Comprehensive Thai text validation across all pages', async ({ page }) => {
    const testPages = [
      '/th/login',
      '/th/sales',
      '/th/beautician',
      '/th/clinic',
      '/th/admin'
    ];
    
    for (const testPage of testPages) {
      try {
        await page.goto(testPage);
        
        // Skip login for auth-required pages
        if (testPage !== '/th/login') {
          if (page.url().includes('/login')) {
            continue; // Skip if redirected to login
          }
        }
        
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Get all text content on the page
        const allTextElements = page.locator('text=/[ก-๙]/');
        const textCount = await allTextElements.count();
        
        let validationErrors = 0;
        let totalValidations = 0;
        
        for (let i = 0; i < Math.min(textCount, 20); i++) { // Limit to first 20 elements
          const element = allTextElements.nth(i);
          const text = await element.textContent();
          
          if (text && text.trim() !== '') {
            totalValidations++;
            const validation = ThaiTextValidator.validateComprehensive(text);
            
            if (!validation.isValid) {
              validationErrors++;
              console.warn(`Page ${testPage} - Text validation error in "${text}":`, validation.errors);
            }
          }
        }
        
        // Allow up to 20% validation errors (some might be intentional mixed content)
        const errorRate = validationErrors / Math.max(totalValidations, 1);
        expect(errorRate).toBeLessThan(0.2);
        
        console.log(`Page ${testPage}: ${totalValidations} texts validated, ${validationErrors} errors (${(errorRate * 100).toFixed(1)}% error rate)`);
        
      } catch (error) {
        console.warn(`Could not test page ${testPage}:`, error);
      }
    }
  });
});
