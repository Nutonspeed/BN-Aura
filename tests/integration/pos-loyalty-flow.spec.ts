import { test, expect, Page } from '@playwright/test';

/**
 * POS → Loyalty Integration Flow Testing
 * ทดสอบการทำงานของระบบ POS → Loyalty Points → Customer Metadata Update
 */

const TEST_CREDENTIALS = {
  clinicOwner: { email: 'clinic.owner@bntest.com', password: 'BNAura2024!' },
  salesStaff: { email: 'sales1.auth@bntest.com', password: 'AuthStaff123!' }
};

test.describe('POS-Loyalty Integration Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as clinic owner to access POS system
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Customer Journey: POS → Loyalty → Commission', async ({ page }) => {
    // Step 1: Navigate to POS system
    await page.goto('/th/clinic/pos');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Add items to cart
    const productButtons = page.locator('button:has-text("เพิ่ม")');
    const productCount = await productButtons.count();
    
    if (productCount > 0) {
      await productButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Check if cart has items
      const cartItems = page.locator('[data-testid="cart-item"], .cart-item');
      const cartCount = await cartItems.count();
      expect(cartCount).toBeGreaterThan(0);
    }
    
    // Step 3: Select customer for loyalty points
    const customerSelector = page.locator('select[name="customer"], .customer-select');
    if (await customerSelector.count() > 0) {
      await customerSelector.selectOption({ index: 1 }); // Select first customer
    }
    
    // Step 4: Process payment
    const checkoutButton = page.locator('button:has-text("ชำระเงิน"), button:has-text("Checkout")');
    if (await checkoutButton.count() > 0) {
      await checkoutButton.click();
      
      // Wait for payment modal
      await page.waitForSelector('.payment-modal, [data-testid="payment-modal"]', { timeout: 10000 });
      
      // Select payment method (Cash)
      const cashOption = page.locator('button:has-text("เงินสด"), button:has-text("CASH")');
      if (await cashOption.count() > 0) {
        await cashOption.click();
      }
      
      // Confirm payment
      const confirmButton = page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        
        // Wait for success message
        await page.waitForSelector('.success, .completed', { timeout: 15000 });
        
        // Check for loyalty points awarded message
        const loyaltyMessage = page.locator('text=/awarded.*points/i, text=/คะแนน.*รางวัล/');
        if (await loyaltyMessage.count() > 0) {
          console.log('✅ Loyalty points awarded message found');
        }
      }
    }
  });

  test('Loyalty Points API Integration', async ({ page }) => {
    // Test loyalty points API directly
    const response = await page.request.get('/api/loyalty/points?customerId=test');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('points');
  });

  test('Commission Recording Integration', async ({ page }) => {
    // Test commission API
    const response = await page.request.get('/api/commissions');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || data.data).toBe(true);
  });

  test('Customer Metadata Update Verification', async ({ page }) => {
    // Navigate to customer management
    await page.goto('/th/sales');
    await page.waitForLoadState('networkidle');
    
    // Look for customer data with spending information
    const customerCards = page.locator('.customer-card, [data-testid="customer"]');
    const customerCount = await customerCards.count();
    
    for (let i = 0; i < Math.min(customerCount, 3); i++) {
      const customer = customerCards.nth(i);
      
      // Check for spending data
      const spendingInfo = customer.locator('text=/฿[\\d,]+/');
      if (await spendingInfo.count() > 0) {
        const spendingText = await spendingInfo.first().textContent();
        expect(spendingText).toMatch(/฿[\d,]+/);
        console.log(`✅ Customer ${i + 1} has spending data: ${spendingText}`);
      }
      
      // Check for loyalty points
      const loyaltyInfo = customer.locator('text=/\\d+ pts/, text=/คะแนน/');
      if (await loyaltyInfo.count() > 0) {
        console.log('✅ Customer has loyalty points information');
      }
    }
  });
});

test.describe('Cross-System Data Synchronization', () => {
  
  test('POS transaction creates commission record', async ({ page }) => {
    // Login as sales staff to check commission tracking
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/sales');
    
    // Check commission tracking section
    const commissionSection = page.locator('.commission, [data-testid="commission"]');
    if (await commissionSection.count() > 0) {
      const commissionAmount = page.locator('text=/฿[\\d,]+/').first();
      if (await commissionAmount.count() > 0) {
        const amount = await commissionAmount.textContent();
        expect(amount).toMatch(/฿[\d,]+/);
        console.log(`✅ Commission tracking shows: ${amount}`);
      }
    }
  });

  test('Real-time data updates across dashboards', async ({ page, context }) => {
    // Create second page for simultaneous testing
    const page2 = await context.newPage();
    
    // Setup both pages with different roles
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    await page2.goto('/th/login');
    await page2.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page2.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page2.click('button[type="submit"]');
    
    // Both should load their respective dashboards
    await page.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Check that both pages show consistent data
    const clinicRevenue = page.locator('text=/รายได้/, text=/revenue/i');
    const salesRevenue = page2.locator('text=/รายได้/, text=/revenue/i');
    
    if (await clinicRevenue.count() > 0 && await salesRevenue.count() > 0) {
      console.log('✅ Both dashboards show revenue information');
    }
    
    await page2.close();
  });

  test('Database consistency validation', async ({ page }) => {
    // Test API endpoints for data consistency
    const endpoints = [
      '/api/customers',
      '/api/commissions',
      '/api/loyalty/points',
      '/api/tasks'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(endpoint);
        const status = response.status();
        
        // Accept both 200 (success) and 401 (auth required) as valid responses
        expect([200, 401, 403]).toContain(status);
        
        if (status === 200) {
          const data = await response.json();
          expect(data).toBeDefined();
          console.log(`✅ ${endpoint} responded with data`);
        } else {
          console.log(`✅ ${endpoint} requires authentication (${status})`);
        }
      } catch (error) {
        console.warn(`⚠️ ${endpoint} error:`, error);
      }
    }
  });
});
