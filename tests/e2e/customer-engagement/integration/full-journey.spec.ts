import { test, expect } from '@playwright/test';
import { 
  loginAsCustomer, 
  bookTreatment, 
  completeTreatment,
  submitReview,
  getCustomerPoints,
  getCustomerTier,
  navigateToCustomerDashboard,
  purchaseMembership
} from '../helpers/customer-helpers';
import {
  checkLoyaltyPoints,
  checkCurrentTier,
  redeemReward,
  checkAchievement,
  getReferralCode,
  copyReferralCode
} from '../helpers/loyalty-helpers';
import { setupTestData, cleanupTestData, createTestBooking, completeTestBooking } from '../helpers/data-setup';

const JOURNEY_CUSTOMERS = {
  primary: {
    email: 'customer.journey@bntest.com',
    password: 'Journey2024!',
    fullName: 'Customer Journey Primary'
  },
  referred: {
    email: 'customer.referred@bntest.com',
    password: 'Referred2024!',
    fullName: 'Customer Journey Referred'
  }
};

test.describe('Full Customer Journey Integration Tests', () => {
  let testData: any;
  let primaryCustomerId: string;
  let referredCustomerId: string;
  let referralCode: string;

  

  

  test('complete customer lifecycle: new customer to diamond tier', async ({ page }) => {
    // Phase 1: New Customer Onboarding
    console.log('Phase 1: New Customer Onboarding');
    
    // Create new customer account
    await page.goto('/th/signup');
    await page.waitForSelector('input[name="fullName"]', { state: 'visible', timeout: 30000 });
    await page.fill('input[name="fullName"]', JOURNEY_CUSTOMERS.primary.fullName);
    await page.fill('input[name="email"]', JOURNEY_CUSTOMERS.primary.email);
    await page.fill('input[name="password"]', JOURNEY_CUSTOMERS.primary.password);
    await page.fill('input[name="confirmPassword"]', JOURNEY_CUSTOMERS.primary.password);
    await page.fill('input[name="phone"]', '0819999999');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=สมัครสมาชิกสำเร็จ')).toBeVisible();
    
    // Login and verify initial state
    await loginAsCustomer(page, JOURNEY_CUSTOMERS.primary);
    await navigateToCustomerDashboard(page);
    
    // Verify starting conditions
    await checkLoyaltyPoints(page, 0);
    await checkCurrentTier(page, 'bronze');
    
    // Take onboarding screenshot
    await page.screenshot({ path: 'test-results/journey/01-onboarding-complete.png' });
    
    // Phase 2: First Treatment Experience
    console.log('Phase 2: First Treatment Experience');
    
    // Book first treatment
    const firstBooking = await bookTreatment(page, {
      treatmentId: testData.treatments[0]?.id || '', // Basic facial
      date: '2026-02-20',
      time: '10:00'
    });
    
    // Complete treatment (simulate staff action)
    await completeTestBooking(page, firstBooking || '');
    await page.waitForTimeout(2000);
    
    // Verify points earned and first achievement
    await checkLoyaltyPoints(page, 150);
    await checkAchievement(page, 'achievement-e2e-1', true); // First Treatment
    
    // Submit first review
    await submitReview(page, firstBooking || '', 5, 'บริการดีมากครับ พนักงานน่ารัก สถานที่สะอาด');
    
    // Take first treatment screenshot
    await page.screenshot({ path: 'test-results/journey/02-first-treatment-complete.png' });
    
    // Phase 3: Loyalty Progression to Silver
    console.log('Phase 3: Loyalty Progression to Silver');
    
    // Book multiple treatments to reach Silver tier (1000 points)
    const treatmentsForSilver = [
      { id: testData.treatments[1].id, date: '2026-02-21', time: '10:00' }, // Advanced - 300 points
      { id: testData.treatments[0].id, date: '2026-02-22', time: '14:00' }, // Basic - 150 points
      { id: testData.treatments[1].id, date: '2026-02-23', time: '10:00' }, // Advanced - 300 points
      { id: testData.treatments[0].id, date: '2026-02-24', time: '14:00' }  // Basic - 150 points
    ];
    
    for (const treatment of treatmentsForSilver) {
      const booking = await bookTreatment(page, treatment);
      await completeTestBooking(page, booking || '');
      await page.waitForTimeout(1000);
    }
    
    // Verify Silver tier achieved
    await checkLoyaltyPoints(page, 1050);
    await checkCurrentTier(page, 'silver');
    
    // Take Silver tier screenshot
    await page.screenshot({ path: 'test-results/journey/03-silver-tier-achieved.png' });
    
    // Phase 4: First Reward Redemption
    console.log('Phase 4: First Reward Redemption');
    
    // Navigate to rewards and redeem first reward
    await page.click('text=รางวัล');
    await page.waitForLoadState('domcontentloaded');
    
    // Redeem 10% discount (500 points)
    const redemptionCode = await redeemReward(page, 'reward-e2e-1');
    expect(redemptionCode).toBeTruthy();
    
    // Verify points deducted
    await checkLoyaltyPoints(page, 550);
    
    // Take reward redemption screenshot
    await page.screenshot({ path: 'test-results/journey/04-first-reward-redemption.png' });
    
    // Phase 5: Membership Purchase
    console.log('Phase 5: Membership Purchase');
    
    // Purchase Silver membership
    await purchaseMembership(page, 'membership-e2e-1');
    
    // Verify membership status
    await expect(page.locator('[data-membership-active]')).toBeVisible();
    await expect(page.locator('text=Silver Member')).toBeVisible();
    
    // Take membership screenshot
    await page.screenshot({ path: 'test-results/journey/05-membership-purchased.png' });
    
    // Phase 6: Referral Program Activation
    console.log('Phase 6: Referral Program Activation');
    
    // Get and copy referral code
    referralCode = await getReferralCode(page);
    await copyReferralCode(page);
    
    // Logout to create referred customer
    await page.click('[data-logout-button]');
    
    // Create referred customer
    await page.goto('/th/signup');
    await page.fill('input[name="fullName"]', JOURNEY_CUSTOMERS.referred.fullName);
    await page.fill('input[name="email"]', JOURNEY_CUSTOMERS.referred.email);
    await page.fill('input[name="password"]', JOURNEY_CUSTOMERS.referred.password);
    await page.fill('input[name="phone"]', '0818888888');
    await page.fill('input[name="referralCode"]', referralCode);
    await page.click('button[type="submit"]');
    
    // Login as referred customer and complete first treatment
    await page.goto('/th/login');
    await loginAsCustomer(page, JOURNEY_CUSTOMERS.referred);
    
    const referredBooking = await bookTreatment(page, {
      treatmentId: testData.treatments[0]?.id || '',
      date: '2026-02-25',
      time: '10:00'
    });
    
    await completeTestBooking(page, referredBooking || '');
    await page.waitForTimeout(2000);
    
    // Take referral activation screenshot
    await page.screenshot({ path: 'test-results/journey/06-referral-activated.png' });
    
    // Phase 7: Progress to Gold Tier
    console.log('Phase 7: Progress to Gold Tier');
    
    // Logout and login as primary customer
    await page.click('[data-logout-button]');
    await loginAsCustomer(page, JOURNEY_CUSTOMERS.primary);
    
    // Continue treatments to reach Gold tier (2500 points)
    const treatmentsForGold = [
      { id: testData.treatments[2].id, date: '2026-02-26', time: '10:00' }, // Spa - 500 points
      { id: testData.treatments[2].id, date: '2026-02-27', time: '14:00' }, // Spa - 500 points
      { id: testData.treatments[3].id, date: '2026-02-28', time: '10:00' }, // Laser - 800 points
      { id: testData.treatments[1].id, date: '2026-03-01', time: '14:00' }  // Advanced - 300 points
    ];
    
    for (const treatment of treatmentsForGold) {
      const booking = await bookTreatment(page, treatment);
      await completeTestBooking(page, booking || '');
      await page.waitForTimeout(1000);
    }
    
    // Add referral bonus points
    await page.waitForTimeout(2000);
    
    // Verify Gold tier achieved
    await checkLoyaltyPoints(page, 2650); // 550 + 2100 (treatments) + 200 (referral bonus)
    await checkCurrentTier(page, 'gold');
    await checkAchievement(page, 'achievement-e2e-5', true); // Loyal Customer
    
    // Take Gold tier screenshot
    await page.screenshot({ path: 'test-results/journey/07-gold-tier-achieved.png' });
    
    // Phase 8: Advanced Features Usage
    console.log('Phase 8: Advanced Features Usage');
    
    // Test premium reward redemption
    await page.click('text=รางวัล');
    await redeemReward(page, 'reward-e2e-2'); // Free Facial - 1500 points
    
    // Test VIP upgrade
    await redeemReward(page, 'reward-e2e-4'); // VIP Upgrade - 1000 points
    
    // Verify remaining points
    await checkLoyaltyPoints(page, 150);
    
    // Take advanced features screenshot
    await page.screenshot({ path: 'test-results/journey/08-advanced-features-used.png' });
    
    // Phase 9: Progress to Platinum Tier
    console.log('Phase 9: Progress to Platinum Tier');
    
    // Book VIP treatment to reach Platinum
    const platinumBooking = await bookTreatment(page, {
      treatmentId: testData.treatments[4]?.id || '', // VIP Full Service - 1500 points
      date: '2026-03-02',
      time: '10:00'
    });
    
    await completeTestBooking(page, platinumBooking || '');
    await page.waitForTimeout(2000);
    
    // Verify Platinum tier achieved
    await checkLoyaltyPoints(page, 1650);
    await checkCurrentTier(page, 'platinum');
    
    // Take Platinum tier screenshot
    await page.screenshot({ path: 'test-results/journey/09-platinum-tier-achieved.png' });
    
    // Phase 10: Final Diamond Push
    console.log('Phase 10: Final Diamond Push');
    
    // Multiple VIP treatments to reach Diamond (10000 points)
    const diamondTreatments = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(2026, 2, 3 + i); // March 3-8, 2026
      diamondTreatments.push({
        treatmentId: testData.treatments[4]?.id || '',
        date: date.toISOString().split('T')[0],
        time: '10:00'
      });
    }
    
    for (const treatment of diamondTreatments) {
      const booking = await bookTreatment(page, treatment);
      await completeTestBooking(page, booking || '');
      await page.waitForTimeout(1000);
    }
    
    // Verify Diamond tier achieved
    await checkLoyaltyPoints(page, 10650);
    await checkCurrentTier(page, 'diamond');
    
    // Take final Diamond tier screenshot
    await page.screenshot({ path: 'test-results/journey/10-diamond-tier-achieved.png' });
    
    // Phase 11: Customer Retention Verification
    console.log('Phase 11: Customer Retention Verification');
    
    // Check all achievements unlocked
    await page.click('text=ความสำเร็ของคุณ');
    await page.waitForLoadState('domcontentloaded');
    
    const achievements = await page.locator('[data-achievement-item]').all();
    const unlockedAchievements = await page.locator('[data-unlocked="true"]').all();
    
    console.log(`Total achievements: ${achievements.length}`);
    console.log(`Unlocked achievements: ${unlockedAchievements.length}`);
    
    // Check complete customer profile
    await navigateToCustomerDashboard(page);
    
    // Verify all sections are populated
    await expect(page.locator('[data-loyalty-widget]')).toContainText('Diamond');
    await expect(page.locator('[data-treatment-history]')).not.toContainText('ยังไม่มีประวัติ');
    await expect(page.locator('[data-membership-widget]')).toContainText('Silver Member');
    
    // Take final journey screenshot
    await page.screenshot({ path: 'test-results/journey/11-journey-complete.png' });
    
    // Generate journey summary
    const journeySummary = {
      customer: JOURNEY_CUSTOMERS.primary.fullName,
      finalTier: 'Diamond',
      totalPoints: 10650,
      totalTreatments: 15,
      totalSpent: 89500, // Calculated from treatment prices
      membershipPurchased: true,
      rewardsRedeemed: 3,
      referralsMade: 1,
      achievementsUnlocked: unlockedAchievements.length
    };
    
    console.log('Journey Summary:', JSON.stringify(journeySummary, null, 2));
    
    // Save journey summary
    await page.evaluate((summary) => {
      console.log('Customer Journey Complete:', summary);
    }, journeySummary);
  });

  test('cross-feature integration: referral + membership + loyalty', async ({ page }) => {
    // Test how multiple features interact
    
    // Login as primary customer
    await loginAsCustomer(page, JOURNEY_CUSTOMERS.primary);
    
    // Verify membership benefits affect loyalty points
    await navigateToCustomerDashboard(page);
    
    // Book a treatment with membership multiplier
    const booking = await bookTreatment(page, {
      treatmentId: testData.treatments[0]?.id || '',
      date: '2026-03-10',
      time: '10:00'
    });
    
    await completeTestBooking(page, booking || '');
    await page.waitForTimeout(2000);
    
    // With Silver membership, should earn 1.5x points (150 * 1.5 = 225)
    const currentPoints = await getCustomerPoints(page);
    expect(currentPoints).toBeGreaterThanOrEqual(10875); // Previous points + bonus
    
    // Take integration test screenshot
    await page.screenshot({ path: 'test-results/journey/cross-feature-integration.png' });
  });

  test('data persistence across sessions', async ({ browser }) => {
    // Test that all journey data persists correctly
    
    // Create new context for fresh session
    const context = await browser.newContext();
    const newPage = await context.newPage();
    
    // Login in fresh session
    await loginAsCustomer(newPage, JOURNEY_CUSTOMERS.primary);
    await navigateToCustomerDashboard(newPage);
    
    // Verify all data is preserved
    await checkLoyaltyPoints(newPage, 10875);
    await checkCurrentTier(newPage, 'diamond');
    await expect(newPage.locator('[data-membership-active]')).toBeVisible();
    
    // Check treatment history preserved
    const historyItems = await newPage.locator('[data-treatment-item]').all();
    expect(historyItems.length).toBeGreaterThan(10);
    
    // Take persistence verification screenshot
    await newPage.screenshot({ path: 'test-results/journey/data-persistence-verified.png' });
    
    await context.close();
  });
});
