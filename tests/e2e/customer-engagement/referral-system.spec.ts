import { test, expect } from '@playwright/test';
import { 
  loginAsCustomer,
  getCustomerPoints,
  navigateToLoyalty,
  copyReferralCode,
  getReferralCode
} from './helpers/customer-helpers';
import { checkLoyaltyPoints, checkAchievement } from './helpers/loyalty-helpers';
import { setupTestData, cleanupTestData, createTestBooking, completeTestBooking } from './helpers/data-setup';

const TEST_CUSTOMERS = {
  referrer: {
    email: 'customer.e2e.1@bntest.com',
    password: 'CustomerE2E1!',
    fullName: 'Customer Referrer Test'
  },
  referred: {
    email: 'customer.e2e.2@bntest.com',
    password: 'CustomerE2E2!',
    fullName: 'Customer Referred Test'
  }
};

test.describe('Referral System E2E Tests', () => {
  let testData: any;
  let referrerId: string;
  let referredId: string;
  let referralCode: string;

  test.beforeAll(async () => {
    // Setup test data
    testData = await setupTestData(page);
    referrerId = testData.customers[0].id;
    referredId = testData.customers[1].id;
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(page, testData);
  });

  test('should generate unique referral code for each customer', async ({ page }) => {
    // Login as referrer
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    // Get referral code
    referralCode = await getReferralCode(page);
    
    // Verify code format
    expect(referralCode).toBeTruthy();
    expect(referralCode).toMatch(/^REF-[A-Z0-9]{6}$/); // Format: REF-XXXXXX
    
    // Copy referral code
    await copyReferralCode(page);
    
    // Verify success message
    await expect(page.locator('text=คัดลอกรหัสแนะนำแล้ว')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referral-code-generated.png' });
  });

  test('should allow new customer to apply referral code during signup', async ({ page }) => {
    // Logout
    await page.click('[data-logout-button]');
    
    // Navigate to signup
    await page.goto('/th/signup');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill signup form
    await page.fill('input[name="fullName"]', TEST_CUSTOMERS.referred.fullName);
    await page.fill('input[name="email"]', TEST_CUSTOMERS.referred.email);
    await page.fill('input[name="password"]', TEST_CUSTOMERS.referred.password);
    await page.fill('input[name="phone"]', '0812345678');
    
    // Apply referral code
    await page.fill('input[name="referralCode"]', referralCode);
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Wait for successful signup
    await expect(page.locator('text=สมัครสมาชิกสำเร็จ')).toBeVisible();
    
    // Login as new customer
    await page.goto('/th/login');
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    
    // Navigate to loyalty to verify referral was applied
    await navigateToLoyalty(page);
    
    // Should show referral applied message
    await expect(page.locator('[data-referral-applied]')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referral-applied-signup.png' });
  });

  test('should track referral status correctly', async ({ page }) => {
    // Login as referrer
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    // Navigate to referral tracking
    await page.click('text=แนะนำเพื่อน');
    await page.waitForLoadState('domcontentloaded');
    
    // Should see pending referral
    const referralList = page.locator('[data-referral-list]');
    await expect(referralList).toBeVisible();
    
    const referralItem = page.locator('[data-referral-item]').first();
    await expect(referralItem).toContainText(TEST_CUSTOMERS.referred.fullName);
    await expect(referralItem).toContainText('รอการยืนยัน');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referral-pending.png' });
  });

  test('should activate referral when referred customer completes first treatment', async ({ page }) => {
    // Login as referred customer
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    
    // Book and complete first treatment
    const bookingId = await createTestBooking(page, {
      customerId: referredId,
      treatmentId: testData.treatments[0].id,
      date: '2026-02-20',
      time: '10:00'
    });
    
    await completeTestBooking(page, bookingId);
    
    // Wait for referral activation
    await page.waitForTimeout(3000);
    
    // Check if referred customer got referral bonus
    await navigateToLoyalty(page);
    await checkLoyaltyPoints(page, 150); // Points from treatment + referral bonus
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referral-activated.png' });
  });

  test('should award referral bonus to referrer', async ({ page }) => {
    // Login as referrer
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    // Check referrer got bonus points
    await checkLoyaltyPoints(page, 200); // Referral bonus points
    
    // Check referral achievement
    await checkAchievement(page, 'achievement-e2e-4', false); // Not yet unlocked (need 3 referrals)
    
    // Navigate to referral tracking
    await page.click('text=แนะนำเพื่อน');
    
    // Should show successful referral
    const referralItem = page.locator('[data-referral-item]').first();
    await expect(referralItem).toContainText(TEST_CUSTOMERS.referred.fullName);
    await expect(referralItem).toContainText('สำเร็จ');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referrer-bonus-awarded.png' });
  });

  test('should handle multiple referrals correctly', async ({ page }) => {
    // Create third customer for multiple referral test
    const thirdCustomer = {
      email: 'customer.e2e.3@bntest.com',
      password: 'CustomerE2E3!',
      fullName: 'Customer Third Test'
    };
    
    // Logout and create third customer
    await page.click('[data-logout-button]');
    await page.goto('/th/signup');
    
    // Fill signup form with referral code
    await page.fill('input[name="fullName"]', thirdCustomer.fullName);
    await page.fill('input[name="email"]', thirdCustomer.email);
    await page.fill('input[name="password"]', thirdCustomer.password);
    await page.fill('input[name="phone"]', '0819999999');
    await page.fill('input[name="referralCode"]', referralCode);
    await page.click('button[type="submit"]');
    
    // Login and complete treatment
    await page.goto('/th/login');
    await loginAsCustomer(page, thirdCustomer.email, thirdCustomer.password);
    
    const bookingId = await createTestBooking(page, {
      customerId: testData.customers[2].id,
      treatmentId: testData.treatments[0].id,
      date: '2026-02-21',
      time: '11:00'
    });
    
    await completeTestBooking(page, bookingId);
    
    // Check as referrer
    await page.click('[data-logout-button]');
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    // Should have points from 2 referrals
    await checkLoyaltyPoints(page, 400); // 200 points per referral
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/multiple-referrals.png' });
  });

  test('should unlock referral achievement after threshold', async ({ page }) => {
    // Create third referral to unlock achievement
    const fourthCustomer = {
      email: 'customer.e2e.4@bntest.com',
      password: 'CustomerE2E4!',
      fullName: 'Customer Fourth Test'
    };
    
    // Create fourth customer
    await page.click('[data-logout-button]');
    await page.goto('/th/signup');
    
    await page.fill('input[name="fullName"]', fourthCustomer.fullName);
    await page.fill('input[name="email"]', fourthCustomer.email);
    await page.fill('input[name="password"]', fourthCustomer.password);
    await page.fill('input[name="phone"]', '0818888888');
    await page.fill('input[name="referralCode"]', referralCode);
    await page.click('button[type="submit"]');
    
    // Login and complete treatment
    await page.goto('/th/login');
    await loginAsCustomer(page, fourthCustomer.email, fourthCustomer.password);
    
    const bookingId = await createTestBooking(page, {
      customerId: testData.customers[3].id,
      treatmentId: testData.treatments[0].id,
      date: '2026-02-22',
      time: '12:00'
    });
    
    await completeTestBooking(page, bookingId);
    
    // Check as referrer
    await page.click('[data-logout-button]');
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    // Should unlock "Social Butterfly" achievement
    await checkAchievement(page, 'achievement-e2e-4', true);
    
    // Take screenshot of achievement unlock
    await page.screenshot({ path: 'test/results/referral-achievement-unlocked.png' });
  });

  test('should display referral analytics to staff', async ({ page }) => {
    // Logout and login as staff
    await page.click('[data-logout-button]');
    await page.fill('input[type="email"]', 'sales1.auth@bntest.com');
    await page.fill('input[type="password"]', 'AuthStaff123!');
    await page.click('button[type="submit"]');
    
    // Navigate to referral analytics
    await page.goto('/th/sales/analytics');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on referral analytics tab
    await page.click('[data-tab="referrals"]');
    
    // Should see referral statistics
    await expect(page.locator('[data-referral-stats]')).toBeVisible();
    await expect(page.locator('[data-total-referrals]')).toBeVisible();
    await expect(page.locator('[data-successful-referrals]')).toBeVisible();
    await expect(page.locator('[data-pending-referrals]')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referral-analytics.png' });
  });

  test('should prevent self-referral', async ({ page }) => {
    // Login as referrer
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    
    // Try to apply own referral code
    await navigateToLoyalty(page);
    const ownCode = await getReferralCode(page);
    
    // Logout and try to signup with own code
    await page.click('[data-logout-button]');
    await page.goto('/th/signup');
    
    await page.fill('input[name="fullName"]', 'Test Self Referral');
    await page.fill('input[name="email"]', 'self.referral@bntest.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.fill('input[name="phone"]', '0817777777');
    await page.fill('input[name="referralCode"]', ownCode);
    await page.click('button[type="submit"]');
    
    // Should show error for self-referral
    await expect(page.locator('text=ไม่สามารถใช้รหัสแนะนำตัวเองได้')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/self-referral-blocked.png' });
  });

  test('should handle expired referral codes', async ({ page }) => {
    // This test would require creating an expired referral code
    // For now, we'll test the UI shows expiration status
    
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    await page.click('text=แนะนำเพื่อน');
    
    // Check if expiration date is shown
    const expirationElement = page.locator('[data-referral-expiration]');
    if (await expirationElement.isVisible()) {
      await expect(expirationElement).toContainText('หมดอายุ');
    }
  });

  test('should generate referral links for social sharing', async ({ page }) => {
    await loginAsCustomer(page, TEST_CUSTOMERS.$1);
    await navigateToLoyalty(page);
    
    await page.click('text=แนะนำเพื่อน');
    
    // Check social sharing buttons
    await expect(page.locator('[data-share-facebook]')).toBeVisible();
    await expect(page.locator('[data-share-line]')).toBeVisible();
    await expect(page.locator('[data-share-copy-link]')).toBeVisible();
    
    // Test copy link functionality
    await page.click('[data-share-copy-link]');
    await expect(page.locator('text=คัดลอกลิงก์แล้ว')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/referral-social-sharing.png' });
  });
});
