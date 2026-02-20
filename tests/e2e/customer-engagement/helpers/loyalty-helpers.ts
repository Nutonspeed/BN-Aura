import { Page, expect } from '@playwright/test';
import { getCustomerPoints, getCustomerTier, navigateToLoyalty } from './customer-helpers';

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  minPoints: number;
  benefits: string[];
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'bronze', minPoints: 0, benefits: ['5% ส่วนลดบริการ', '1x คะแนนสะสม'] },
  { name: 'silver', minPoints: 1000, benefits: ['10% ส่วนลดบริการ', '1.5x คะแนนสะสม', 'ของขวัญวันเกิด'] },
  { name: 'gold', minPoints: 2500, benefits: ['15% ส่วนลดบริการ', '2x คะแนนสะสม', 'ของขวัญวันเกิด', 'บริการพิเศษ'] },
  { name: 'platinum', minPoints: 5000, benefits: ['20% ส่วนลดบริการ', '2.5x คะแนนสะสม', 'ของขวัญวันเกิด', 'บริการพิเศษ', 'VIP Lounge'] },
  { name: 'diamond', minPoints: 10000, benefits: ['25% ส่วนลดบริการ', '3x คะแนนสะสม', 'ของขวัญวันเกิด', 'บริการพิเศษ', 'VIP Lounge', 'Personal Assistant'] }
];

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'service' | 'product' | 'experience';
  isActive: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'treatment' | 'referral' | 'spending' | 'milestone' | 'special';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    points: number;
    badge: string;
  };
  isUnlocked: boolean;
  unlockedAt?: string;
}

/**
 * Check loyalty points balance
 */
export async function checkLoyaltyPoints(page: Page, expectedPoints: number) {
  const pointsElement = page.locator('[data-loyalty-points]');
  const actualPoints = await pointsElement.textContent();
  expect(actualPoints).toContain(expectedPoints.toString());
}

/**
 * Check current loyalty tier
 */
export async function checkCurrentTier(page: Page, expectedTier: string) {
  const tierElement = page.locator('[data-loyalty-tier]');
  const actualTier = await tierElement.textContent();
  expect(actualTier?.toLowerCase()).toBe(expectedTier.toLowerCase());
}

/**
 * Check tier progress
 */
export async function checkTierProgress(page: Page, expectedProgress: number) {
  const progressBar = page.locator('[data-tier-progress]');
  const progressValue = await progressBar.getAttribute('aria-valuenow');
  expect(parseInt(progressValue || '0')).toBe(expectedProgress);
}

/**
 * Navigate to rewards section
 */
export async function navigateToRewards(page: Page) {
  await page.click('text=รางวัล');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h2:has-text("รางวัลของคุณ")')).toBeVisible();
}

/**
 * Get available rewards
 */
export async function getAvailableRewards(page: Page): Promise<Reward[]> {
  const rewardElements = await page.locator('[data-reward-item]').all();
  const rewards: Reward[] = [];
  
  for (const element of rewardElements) {
    const id = await element.getAttribute('data-reward-id');
    const name = await element.locator('[data-reward-name]').textContent();
    const description = await element.locator('[data-reward-description]').textContent();
    const pointsCost = parseInt(await element.locator('[data-reward-points]').textContent() || '0');
    const type = await element.getAttribute('data-reward-type') as Reward['type'];
    const isActive = await element.getAttribute('data-reward-active') === 'true';
    
    if (id && name) {
      rewards.push({ id, name, description: description || '', pointsCost, type, isActive });
    }
  }
  
  return rewards;
}

/**
 * Redeem a reward
 */
export async function redeemReward(page: Page, rewardId: string): Promise<string> {
  await navigateToRewards(page);
  
  // Find and click the reward
  const reward = page.locator(`[data-reward-id="${rewardId}"]`);
  await reward.click();
  
  // Click redeem button
  await page.click('text=แลกรับรางวัล');
  
  // Confirm redemption
  await page.click('text=ยืนยันการแลกรับ');
  
  // Wait for success message
  await expect(page.locator('text=แลกรับรางวัลสำเร็จ')).toBeVisible();
  
  // Check for redemption code
  const codeElement = page.locator('[data-redemption-code]');
  const code = await codeElement.textContent();
  expect(code).toBeTruthy();
  
  return code || '';
}

/**
 * Navigate to achievements section
 */
export async function navigateToAchievements(page: Page) {
  await page.click('text=ความสำเร็ของคุณ');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h2:has-text("ความสำเร็ของคุณ")')).toBeVisible();
}

/**
 * Get all achievements
 */
export async function getAllAchievements(page: Page): Promise<Achievement[]> {
  const achievementElements = await page.locator('[data-achievement-item]').all();
  const achievements: Achievement[] = [];
  
  for (const element of achievementElements) {
    const id = await element.getAttribute('data-achievement-id');
    const name = await element.locator('[data-achievement-name]').textContent();
    const description = await element.locator('[data-achievement-description]').textContent();
    const icon = await element.getAttribute('data-achievement-icon') || '';
    const category = await element.getAttribute('data-achievement-category') as Achievement['category'];
    const isUnlocked = await element.getAttribute('data-unlocked') === 'true';
    const unlockedAt = await element.getAttribute('data-unlocked-at') || undefined;
    
    if (id && name) {
      achievements.push({
        id,
        name,
        description: description || '',
        icon,
        category,
        requirement: { type: 'points', value: 0 }, // Simplified for test
        reward: { points: 0, badge: '' }, // Simplified for test
        isUnlocked,
        unlockedAt
      });
    }
  }
  
  return achievements;
}

/**
 * Check if achievement is unlocked
 */
export async function checkAchievement(page: Page, achievementId: string, shouldBeUnlocked: boolean) {
  await navigateToAchievements(page);
  
  const achievement = page.locator(`[data-achievement-id="${achievementId}"]`);
  const isUnlocked = await achievement.locator('[data-unlocked="true"]').isVisible();
  
  if (shouldBeUnlocked) {
    expect(isUnlocked).toBeTruthy();
  } else {
    expect(isUnlocked).toBeFalsy();
  }
}

/**
 * Navigate to points history
 */
export async function navigateToPointsHistory(page: Page) {
  await navigateToLoyalty(page);
  await page.click('text=ประวัติคะแนน');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h2:has-text("ประวัติคะแนนสะสม")')).toBeVisible();
}

/**
 * Get points history
 */
export async function getPointsHistory(page: Page) {
  const transactionElements = await page.locator('[data-transaction-item]').all();
  const transactions = [];
  
  for (const element of transactionElements) {
    const id = await element.getAttribute('data-transaction-id');
    const type = await element.getAttribute('data-transaction-type');
    const points = parseInt(await element.locator('[data-transaction-points]').textContent() || '0');
    const description = await element.locator('[data-transaction-description]').textContent();
    const date = await element.locator('[data-transaction-date]').textContent();
    
    if (id && type) {
      transactions.push({ id, type, points, description: description || '', date: date || '' });
    }
  }
  
  return transactions;
}

/**
 * Verify points transaction
 */
export async function verifyPointsTransaction(page: Page, expectedTransaction: {
  type: string;
  points: number;
  description: string;
}) {
  const history = await getPointsHistory(page);
  
  const found = history.find(t => 
    t.type === expectedTransaction.type &&
    t.points === expectedTransaction.points &&
    t.description.includes(expectedTransaction.description)
  );
  
  expect(found).toBeTruthy();
}

/**
 * Calculate expected tier based on points
 */
export function calculateExpectedTier(points: number): string {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (points >= LOYALTY_TIERS[i].minPoints) {
      return LOYALTY_TIERS[i].name;
    }
  }
  return 'bronze';
}

/**
 * Calculate tier progress percentage
 */
export function calculateTierProgress(points: number, currentTier: string): number {
  const tierIndex = LOYALTY_TIERS.findIndex(t => t.name === currentTier);
  if (tierIndex === -1 || tierIndex === LOYALTY_TIERS.length - 1) return 100;
  
  const currentTierMin = LOYALTY_TIERS[tierIndex].minPoints;
  const nextTierMin = LOYALTY_TIERS[tierIndex + 1].minPoints;
  const tierRange = nextTierMin - currentTierMin;
  const progress = points - currentTierMin;
  
  return Math.min(Math.round((progress / tierRange) * 100), 100);
}

/**
 * Wait for points to update
 */
export async function waitForPointsUpdate(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      const points = document.querySelector('[data-loyalty-points]');
      return points && points.textContent !== '0';
    },
    { timeout }
  );
}

/**
 * Simulate earning points
 */
export async function simulateEarnPoints(page: Page, treatmentData: {
  treatmentId: string;
  expectedPoints: number;
}) {
  // This would typically be triggered by completing a treatment
  // For testing, we'll use the API to add points
  const response = await page.request.post('/api/loyalty/points/earn', {
    data: {
      treatmentId: treatmentData.treatmentId,
      points: treatmentData.expectedPoints,
      description: `คะแนนจากการรักษา #${treatmentData.treatmentId}`
    }
  });
  
  expect(response.ok()).toBeTruthy();
  
  // Wait for UI to update
  await waitForPointsUpdate(page);
  
  // Verify points were added
  await checkLoyaltyPoints(page, treatmentData.expectedPoints);
}

/**
 * Get referral code
 */
export async function getReferralCode(page: Page): Promise<string> {
  const codeElement = page.locator('[data-referral-code]');
  const code = await codeElement.textContent();
  expect(code).toBeTruthy();
  return code || '';
}

/**
 * Copy referral code
 */
export async function copyReferralCode(page: Page) {
  const copyButton = page.locator('[data-copy-referral]');
  await copyButton.click();
  // Check for success message
  await expect(page.locator('text=คัดลอกรหัสแนะนำแล้ว')).toBeVisible();
}
