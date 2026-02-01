import { test, expect } from '@playwright/test';
import { AuthPage } from '../utils/page-objects/auth-page';
import { DashboardPage } from '../utils/page-objects/dashboard-page';
import { TEST_USERS } from '../utils/test-data';

test.describe('Authentication & Role-Based Access', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('Super Admin login and navigation access', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.super_admin.email, TEST_USERS.super_admin.password);
    
    await authPage.expectSuccessfulLogin();
    await page.waitForURL(/\/admin/);
    
    // Super Admin should have access to all sections
    await dashboardPage.expectNavigationVisible([
      'Admin Dashboard',
      'Clinic Management', 
      'System Analytics',
      'User Management'
    ]);
  });

  test('Clinic Owner login and role restrictions', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.clinic_owner_1.email, TEST_USERS.clinic_owner_1.password);
    
    await authPage.expectSuccessfulLogin();
    await page.waitForURL(/\/clinic/);
    
    // Clinic Owner should have access to clinic management
    await dashboardPage.expectNavigationVisible([
      'Dashboard',
      'Staff Management',
      'Inventory',
      'Analytics',
      'Settings'
    ]);
    
    // But NOT system-wide admin features
    await dashboardPage.expectNavigationHidden([
      'System Analytics',
      'Global User Management'
    ]);
  });

  test('Sales Staff login and permissions', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    
    await authPage.expectSuccessfulLogin();
    await page.waitForURL(/\/sales/);
    
    // Sales Staff should have access to customer-facing features
    await dashboardPage.expectNavigationVisible([
      'Magic Scan',
      'Customer Management',
      'Leads Pipeline',
      'Proposals',
      'Chat Center'
    ]);
    
    // But NOT administrative features
    await dashboardPage.expectNavigationHidden([
      'Staff Management',
      'System Settings',
      'Inventory Management'
    ]);
  });

  test('Beautician login and task-focused access', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.beautician_1.email, TEST_USERS.beautician_1.password);
    
    await authPage.expectSuccessfulLogin();
    await page.waitForURL(/\/beautician/);
    
    // Beautician should have access to treatment workflow
    await dashboardPage.expectNavigationVisible([
      'Task Queue',
      'Treatment Protocols', 
      'Customer Progress',
      'Schedule'
    ]);
    
    // But NOT sales or management features
    await dashboardPage.expectNavigationHidden([
      'Lead Generation',
      'Pricing Management',
      'Staff Settings'
    ]);
  });

  test('Customer portal access', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.customer_1.email, TEST_USERS.customer_1.password);
    
    await authPage.expectSuccessfulLogin();
    await page.waitForURL(/\/customer/);
    
    // Customer should have access to personal features only
    await dashboardPage.expectNavigationVisible([
      'My Skin Profile',
      'Treatment Journey',
      'Appointments',
      'Chat with Advisor'
    ]);
  });

  test('Invalid credentials handling', async ({ page }) => {
    await authPage.goto();
    await authPage.login('invalid@email.com', 'wrongpassword');
    
    await authPage.expectLoginError();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Logout functionality', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
    
    await authPage.logout();
    await authPage.expectLoggedOut();
  });

  test('Session persistence after page reload', async ({ page }) => {
    await authPage.goto();
    await authPage.login(TEST_USERS.clinic_owner_1.email, TEST_USERS.clinic_owner_1.password);
    await authPage.expectSuccessfulLogin();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    await expect(page).toHaveURL(/\/clinic/);
  });
});
