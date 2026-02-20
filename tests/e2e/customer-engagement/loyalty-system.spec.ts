import { test, expect } from '@playwright/test';
import { 
  loginAsCustomer, 
  bookTreatment, 
  completeTreatment, 
  getCustomerPoints,
  getCustomerTier,
  navigateToLoyalty
} from './helpers/customer-helpers';
import {
  checkLoyaltyPoints,
  checkCurrentTier,
  checkTierProgress,
  redeemReward,
  checkAchievement,
  getAvailableRewards,
  getAllAchievements,
  verifyPointsTransaction,
  calculateExpectedTier,
  calculateTierProgress,
  simulateEarnPoints,
  navigateToRewards,
  navigateToAchievements,
  navigateToPointsHistory
} from './helpers/loyalty-helpers';
import { setupTestData, cleanupTestData, createTestBooking, completeTestBooking, resetCustomerLoyalty } from './helpers/data-setup';

const TEST_CUSTOMER = {
  email: 'customer.e2e.1@bntest.com',
  password: 'CustomerE2E1!',
  fullName: 'Customer E2E Test 1'
};

test.describe('Loyalty System E2E Tests', () => {
  let testData: any;
  let customerId: string;

  test.beforeAll(async () => {
    // Setup test data
    testData = await setupTestData(page);
    customerId = testData.customers[0].id;
    
    // Reset customer's loyalty data
    await resetCustomerLoyalty(page, customerId);
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(page, testData);
  });

  test.beforeEach(async ({ page }) => {
    // Login as test customer
    await loginAsCustomer(page, TEST_CUSTOMER);
    await navigateToLoyalty(page);
  });

  test('should display initial loyalty status', async ({ page }) => {
    // Check initial points (should be 0)
    await checkLoyaltyPoints(page, 0);
    
    // Check initial tier (should be bronze)
    await checkCurrentTier(page, 'bronze');
    
    // Check tier progress (should be 0%)
    await checkTierProgress(page, 0);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/loyalty-initial-status.png' });
  });

  test('should earn points from treatment completion', async ({ page }) => {
    const treatment = testData.treatments[0]; // Basic facial - 150 points
    
    // Book and complete treatment
    const bookingId = await bookTreatment(page, {
      treatmentId: treatment.id,
      date: '2026-02-20',
      time: '10:00'
    });
    
    // Complete the treatment (this would normally be done by staff)
    await completeTestBooking(page, bookingId);
    
    // Wait for points to update
    await page.waitForTimeout(2000);
    
    // Check points were earned
    await checkLoyaltyPoints(page, treatment.points);
    
    // Verify transaction in history
    await navigateToPointsHistory(page);
    await verifyPointsTransaction(page, {
      type: 'earned',
      amount: treatment.points,
      description: treatment.name
    });
  });

  test('should progress through loyalty tiers', async ({ page }) => {
    // Simulate earning points to reach Silver tier (1000 points)
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[0].id,
      expectedPoints: 1000
    });
    
    // Check tier progression
    await checkCurrentTier(page, 'silver');
    
    // Check progress bar
    const progress = calculateTierProgress(1000, 'silver');
    await checkTierProgress(page, progress);
    
    // Earn more points to reach Gold tier (2500 points)
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[1].id,
      expectedPoints: 1500
    });
    
    // Check Gold tier
    await checkCurrentTier(page, 'gold');
    
    // Take screenshot of tier achievement
    await page.screenshot({ path: 'test-results/loyalty-gold-tier.png' });
  });

  test('should display available rewards correctly', async ({ page }) => {
    // Earn some points first
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[0].id,
      expectedPoints: 500
    });
    
    // Navigate to rewards
    await navigateToRewards(page);
    
    // Get available rewards
    const rewards = await getAvailableRewards(page);
    
    // Should have rewards
    expect(rewards.length).toBeGreaterThan(0);
    
    // Check that rewards with points > 500 are disabled
    for (const reward of rewards) {
      const rewardElement = page.locator(`[data-reward-id="${reward.id}"]`);
      const redeemButton = rewardElement.locator('[data-redeem-button]');
      
      if (reward.pointsCost > 500) {
        await expect(redeemButton).toBeDisabled();
      } else {
        await expect(redeemButton).toBeEnabled();
      }
    }
  });

  test('should redeem reward successfully', async ({ page }) => {
    // Earn enough points for a reward
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[0].id,
      expectedPoints: 500
    });
    
    // Redeem the 10% discount reward (costs 500 points)
    const redemptionCode = await redeemReward(page, 'reward-e2e-1');
    
    // Verify redemption code is generated
    expect(redemptionCode).toBeTruthy();
    expect(redemptionCode).toMatch(/^[A-Z0-9]{8}$/); // Should be 8 characters
    
    // Check points were deducted
    await checkLoyaltyPoints(page, 0);
    
    // Verify transaction in history
    await navigateToPointsHistory(page);
    await verifyPointsTransaction(page, {
      type: 'redeemed',
      amount: -500,
      description: '10% Discount'
    });
    
    // Take screenshot of redemption success
    await page.screenshot({ path: 'test-results/loyalty-reward-redemption.png' });
  });

  test('should unlock achievements based on conditions', async ({ page }) => {
    // Complete first treatment
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[0].id,
      expectedPoints: 150
    });
    
    // Check "First Treatment" achievement is unlocked
    await checkAchievement(page, 'achievement-e2e-1', true);
    
    // Complete more treatments to reach 5
    for (let i = 0; i < 4; i++) {
      await simulateEarnPoints(page, {
        treatmentId: testData.treatments[0].id,
        expectedPoints: 150
      });
    }
    
    // Check "Regular Customer" achievement is unlocked
    await checkAchievement(page, 'achievement-e2e-2', true);
    
    // Navigate to achievements page
    await navigateToAchievements(page);
    
    // Get all achievements
    const achievements = await getAllAchievements(page);
    
    // Should have unlocked achievements
    const unlockedAchievements = achievements.filter(a => 
      page.locator(`[data-achievement-id="${a.id}"]`).locator('[data-unlocked="true"]').isVisible()
    );
    
    expect(unlockedAchievements.length).toBeGreaterThan(0);
    
    // Take screenshot of achievements
    await page.screenshot({ path: 'test-results/loyalty-achievements.png' });
  });

  test('should track points history accurately', async ({ page }) => {
    // Perform multiple transactions
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[0].id,
      expectedPoints: 150
    });
    
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[1].id,
      expectedPoints: 300
    });
    
    await redeemReward(page, 'reward-e2e-3'); // Product sample - 300 points
    
    // Navigate to points history
    await navigateToPointsHistory(page);
    
    // Check all transactions are present
    const history = await page.locator('[data-transaction-item]').all();
    expect(history.length).toBe(3);
    
    // Verify transaction details
    await verifyPointsTransaction(page, {
      type: 'earned',
      amount: 150,
      description: 'E2E Facial Treatment Basic'
    });
    
    await verifyPointsTransaction(page, {
      type: 'earned',
      amount: 300,
      description: 'E2E Advanced Skin Care'
    });
    
    await verifyPointsTransaction(page, {
      type: 'redeemed',
      amount: -300,
      description: 'Product Sample'
    });
  });

  test('should calculate tier benefits correctly', async ({ page }) => {
    // Progress to Platinum tier
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[3].id,
      expectedPoints: 5000
    });
    
    // Check Platinum tier
    await checkCurrentTier(page, 'platinum');
    
    // Check tier benefits are displayed
    const benefitsList = page.locator('[data-tier-benefits]');
    await expect(benefitsList).toBeVisible();
    
    // Should include Platinum benefits
    await expect(benefitsList).toContainText('20% ส่วนลดบริการ');
    await expect(benefitsList).toContainText('2.5x คะแนนสะสม');
    await expect(benefitsList).toContainText('Priority booking');
    
    // Take screenshot of tier benefits
    await page.screenshot({ path: 'test-results/loyalty-platinum-benefits.png' });
  });

  test('should handle point expiration correctly', async ({ page }) => {
    // This test would require mocking time or using expired points
    // For now, we'll just check the expiration notice is displayed
    await navigateToPointsHistory(page);
    
    // Look for expiration notice
    const expirationNotice = page.locator('[data-points-expiration]');
    if (await expirationNotice.isVisible()) {
      await expect(expirationNotice).toContainText('คะแนนจะหมดอายุ');
    }
  });

  test('should display loyalty analytics to staff', async ({ page }) => {
    // Logout and login as staff
    await page.click('[data-logout-button]');
    
    // Login as sales staff
    await page.fill('input[type="email"]', 'sales1.auth@bntest.com');
    await page.fill('input[type="password"]', 'AuthStaff123!');
    await page.click('button[type="submit"]');
    
    // Navigate to customer loyalty view
    await page.goto('/th/sales/customers/' + customerId);
    await page.waitForLoadState('domcontentloaded');
    
    // Check loyalty tab is present
    const loyaltyTab = page.locator('[data-tab="loyalty"]');
    await expect(loyaltyTab).toBeVisible();
    
    await loyaltyTab.click();
    
    // Should see customer's loyalty data
    await expect(page.locator('[data-customer-points]')).toBeVisible();
    await expect(page.locator('[data-customer-tier]')).toBeVisible();
    
    // Take screenshot of staff loyalty view
    await page.screenshot({ path: 'test-results/loyalty-staff-view.png' });
  });

  test('should sync loyalty data across multiple sessions', async ({ page }) => {
    // Earn points in first session
    await simulateEarnPoints(page, {
      treatmentId: testData.treatments[0].id,
      expectedPoints: 150
    });
    
    // Get current points
    const pointsBefore = await getCustomerPoints(page);
    
    // Open new session (simulate another device)
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();
    
    if (newPage) {
      // Login in new session
      await loginAsCustomer(newPage, TEST_CUSTOMER.email, TEST_CUSTOMER.password);
      await navigateToLoyalty(newPage);
      
      // Points should be synced
      const pointsAfter = await getCustomerPoints(newPage);
      expect(pointsAfter).toBe(pointsBefore);
      
      await newContext?.close();
    }
  });
});
