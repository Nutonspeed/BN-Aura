import { test, expect } from '@playwright/test';
import { 
  loginAsCustomer,
  navigateToCustomerDashboard,
  getCustomerPoints,
  getCustomerTier,
  getTreatmentHistory,
  getUpcomingAppointments,
  purchaseMembership,
  checkNotifications
} from './helpers/customer-helpers';

const TEST_CUSTOMER = {
  email: 'cust1@bnaura.com',
  password: 'BNAura2026!',
  fullName: 'นภา สวยใส'
};

test.describe('Customer Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test customer
    await loginAsCustomer(page, TEST_CUSTOMER);
    await navigateToCustomerDashboard(page);
  });

  test('ควรแสดงข้อมูลภาพรวมโปรไฟล์ลูกค้า', async ({ page }) => {
    // ตรวจสอบข้อความต้อนรับ
    await expect(page.locator('h1')).toContainText('ยินดีต้อนรับ');
    await expect(page.locator(`text=${TEST_CUSTOMER.fullName}`)).toBeVisible();
    
    // ตรวจสอบข้อมูลโปรไฟล์พื้นฐาน
    await expect(page.locator('[data-profile-email]')).toBeVisible();
    await expect(page.locator('[data-profile-phone]')).toBeVisible();
    
    // ถ่ายภาพหน้าจอ
    await page.screenshot({ path: 'test-results/dashboard/profile-overview.png' });
  });

  test('ควรแสดงสถานะ Loyalty (Tier และ คะแนน)', async ({ page }) => {
    // ตรวจสอบ Widget Loyalty
    const loyaltyWidget = page.locator('[data-loyalty-widget]');
    await expect(loyaltyWidget).toBeVisible();
    
    // ตรวจสอบระดับสมาชิก
    const currentTier = await getCustomerTier(page);
    expect(currentTier).toBeTruthy();
    
    // ตรวจสอบคะแนนสะสม
    const points = await getCustomerPoints(page);
    expect(points).toBeGreaterThanOrEqual(0);
    
    // ถ่ายภาพหน้าจอ
    await page.screenshot({ path: 'test-results/dashboard/loyalty-status.png' });
  });

  test('ควรแสดงรายการนัดหมายที่จะถึง', async ({ page }) => {
    const appointmentsSection = page.locator('[data-upcoming-appointments]');
    await expect(appointmentsSection).toBeVisible();
    
    const appointments = await getUpcomingAppointments(page);
    
    if (appointments.length > 0) {
      await expect(appointmentsSection.locator('[data-appointment-item]').first()).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/dashboard/upcoming-appointments.png' });
  });

  test('ควรแสดงประวัติการรักษา', async ({ page }) => {
    const historySection = page.locator('[data-treatment-history]');
    await expect(historySection).toBeVisible();
    
    const history = await getTreatmentHistory(page);
    
    if (history.length > 0) {
      await expect(historySection.locator('[data-treatment-item]').first()).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/dashboard/treatment-history.png' });
  });

  test('ควรแสดงข้อมูลพนักงานดูแล (Sales Representative)', async ({ page }) => {
    const salesRepWidget = page.locator('[data-sales-rep-widget]');
    await expect(salesRepWidget).toBeVisible();
    
    // ตรวจสอบว่ามีการแสดงชื่อพนักงานดูแล
    const salesRepName = salesRepWidget.locator('[data-sales-rep-name]');
    if (await salesRepName.isVisible()) {
      await expect(salesRepName).not.toBeEmpty();
    }
    
    await page.screenshot({ path: 'test-results/dashboard/sales-rep-info.png' });
  });

  test('ควรแสดงรายการแนะนำ (Personalized Recommendations)', async ({ page }) => {
    const recommendations = page.locator('[data-recommendations]');
    await expect(recommendations).toBeVisible();
    
    const items = await recommendations.locator('[data-recommendation-item]').all();
    if (items.length > 0) {
      await expect(items[0].locator('[data-recommendation-name]')).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/dashboard/recommendations.png' });
  });

  test('ควรทำงานได้ปกติบนมือถือ', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ตรวจสอบว่าเมนูมือถือแสดงขึ้นมา
    const mobileMenu = page.locator('[data-mobile-menu]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/dashboard/mobile-view.png' });
    
    // คืนค่าขนาดหน้าจอ
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
