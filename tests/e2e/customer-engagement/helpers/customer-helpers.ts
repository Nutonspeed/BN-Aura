import { Page, expect } from '@playwright/test';
import { login } from '../../helpers';

export interface CustomerData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  skinType?: string;
}

/**
 * Login as customer
 */
export async function loginAsCustomer(page: Page, customer: CustomerData) {
  await page.goto('/th/login');
  await page.fill('input[name="email"]', customer.email);
  await page.fill('input[name="password"]', customer.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/th/customer');
  await expect(page.locator('h1')).toContainText('ยินดีต้อนรับ');
}

/**
 * Navigate to customer dashboard
 */
export async function navigateToCustomerDashboard(page: Page) {
  await page.goto('/th/customer');
  await expect(page.locator('h1')).toContainText('แดชบอร์ดลูกค้า');
}

/**
 * Book a treatment
 */
export async function bookTreatment(page: Page, treatment: {
  treatmentId: string;
  date: string;
  time: string;
}) {
  await page.goto('/th/customer/bookings');
  await page.click('[data-book-treatment]');
  await page.selectOption('[data-treatment-select]', treatment.treatmentId);
  await page.fill('[data-date-input]', treatment.date);
  await page.fill('[data-time-input]', treatment.time);
  await page.click('[data-confirm-booking]');
  
  const bookingId = await page.locator('[data-booking-id]').textContent();
  return bookingId || '';
}

/**
 * Complete a treatment
 */
export async function completeTreatment(page: Page, bookingId: string) {
  await page.goto(`/th/customer/bookings/${bookingId}`);
  await page.click('[data-complete-treatment]');
  await page.click('[data-confirm-complete]');
  await expect(page.locator('text=การรักษาเสร็จสิ้น')).toBeVisible();
}

/**
 * Submit a review
 */
export async function submitReview(page: Page, bookingId: string, rating: number, comment: string) {
  await page.goto(`/th/customer/bookings/${bookingId}`);
  await page.click('[data-write-review]');
  await page.click(`[data-rating="${rating}"]`);
  await page.fill('[data-review-comment]', comment);
  await page.click('[data-submit-review]');
  await expect(page.locator('text=รีวิวของคุณถูกส่งแล้ว')).toBeVisible();
}

/**
 * Get customer points
 */
export async function getCustomerPoints(page: Page): Promise<number> {
  const pointsElement = page.locator('[data-customer-points]');
  const pointsText = await pointsElement.textContent();
  return parseInt(pointsText || '0');
}

/**
 * Get customer tier
 */
export async function getCustomerTier(page: Page): Promise<string> {
  const tierElement = page.locator('[data-customer-tier]');
  return await tierElement.textContent() || '';
}

/**
 * Navigate to loyalty section
 */
export async function navigateToLoyalty(page: Page) {
  await page.click('[data-nav-loyalty]');
  await expect(page.locator('h1')).toContainText('คะแนนสะสม');
}

/**
 * Get treatment history
 */
export async function getTreatmentHistory(page: Page) {
  await page.goto('/th/customer/history');
  const treatments = await page.locator('[data-treatment-item]').all();
  const history = [];
  
  for (const treatment of treatments) {
    const id = await treatment.getAttribute('data-treatment-id');
    const name = await treatment.locator('[data-treatment-name]').textContent();
    const date = await treatment.locator('[data-treatment-date]').textContent();
    const status = await treatment.locator('[data-treatment-status]').textContent();
    
    if (id && name) {
      history.push({ id, name, date: date || '', status: status || '' });
    }
  }
  
  return history;
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(page: Page) {
  await page.goto('/th/customer/appointments');
  const appointments = await page.locator('[data-appointment-item]').all();
  const upcoming = [];
  
  for (const appointment of appointments) {
    const id = await appointment.getAttribute('data-appointment-id');
    const treatment = await appointment.locator('[data-appointment-treatment]').textContent();
    const date = await appointment.locator('[data-appointment-date]').textContent();
    const time = await appointment.locator('[data-appointment-time]').textContent();
    
    if (id && treatment) {
      upcoming.push({ id, treatment, date: date || '', time: time || '' });
    }
  }
  
  return upcoming;
}

/**
 * Navigate to membership section
 */
export async function navigateToMembership(page: Page) {
  await page.click('[data-nav-membership]');
  await expect(page.locator('h1')).toContainText('สมาชิก');
}

/**
 * Purchase membership
 */
export async function purchaseMembership(page: Page, membershipId: string) {
  await navigateToMembership(page);
  await page.click(`[data-membership="${membershipId}"]`);
  await page.click('[data-purchase-membership]');
  await page.click('[data-confirm-purchase]');
  await expect(page.locator('text=การสั่งซื้อสำเร็จ')).toBeVisible();
}

/**
 * Check notifications
 */
export async function checkNotifications(page: Page) {
  await page.click('[data-notifications]');
  await expect(page.locator('[data-notifications-panel]')).toBeVisible();
  const notifications = await page.locator('[data-notification-item]').all();
  const list = [];
  
  for (const notification of notifications) {
    const id = await notification.getAttribute('data-notification-id');
    const message = await notification.locator('[data-notification-message]').textContent();
    const date = await notification.locator('[data-notification-date]').textContent();
    
    if (id && message) {
      list.push({ id, message, date: date || '' });
    }
  }
  
  return list;
}

/**
 * Get referral code
 */
export async function getReferralCode(page: Page): Promise<string> {
  const codeElement = page.locator('[data-referral-code]');
  return await codeElement.textContent() || '';
}

/**
 * Copy referral code
 */
export async function copyReferralCode(page: Page) {
  await page.click('[data-copy-referral]');
  await expect(page.locator('text=คัดลอกรหัสแนะนำแล้ว')).toBeVisible();
}

/**
 * Check if achievement is unlocked
 */
export async function isAchievementUnlocked(page: Page, achievementId: string): Promise<boolean> {
  await page.goto('/th/customer/achievements');
  const achievement = page.locator(`[data-achievement="${achievementId}"]`);
  return await achievement.locator('[data-unlocked="true"]').isVisible();
}
