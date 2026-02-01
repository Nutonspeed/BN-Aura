import { test, expect } from '@playwright/test';
import { AuthPage } from '../utils/page-objects/auth-page';
import { DashboardPage } from '../utils/page-objects/dashboard-page';
import { TEST_USERS, TEST_CLINICS } from '../utils/test-data';

test.describe('Multi-Tenant Data Isolation & RLS Security', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test('Clinic data isolation - users can only see their clinic data', async ({ page }) => {
    // Test Clinic 1 user access
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    
    await authPage.goto();
    await authPage.login(TEST_USERS.clinic_owner_1.email, TEST_USERS.clinic_owner_1.password);
    await authPage.expectSuccessfulLogin();
    
    // Navigate to customer management
    await page.goto('/th/clinic/customers');
    await page.waitForLoadState('networkidle');
    
    // Verify only Clinic 1 customers are visible
    const customerRows = page.locator('[data-testid="customer-row"]');
    const customerCount = await customerRows.count();
    
    // Check that all visible customers belong to clinic 1
    for (let i = 0; i < customerCount; i++) {
      const clinicId = await customerRows.nth(i).locator('[data-testid="customer-clinic-id"]').textContent();
      expect(clinicId).toBe(TEST_CLINICS.clinic_1.id);
    }
    
    await authPage.logout();
    
    // Test Clinic 2 user access
    await authPage.login(TEST_USERS.clinic_owner_2.email, TEST_USERS.clinic_owner_2.password);
    await authPage.expectSuccessfulLogin();
    
    await page.goto('/th/clinic/customers');
    await page.waitForLoadState('networkidle');
    
    const clinic2CustomerRows = page.locator('[data-testid="customer-row"]');
    const clinic2CustomerCount = await clinic2CustomerRows.count();
    
    // Verify different customer set for clinic 2
    expect(clinic2CustomerCount).not.toBe(customerCount);
    
    // Check that all visible customers belong to clinic 2
    for (let i = 0; i < clinic2CustomerCount; i++) {
      const clinicId = await clinic2CustomerRows.nth(i).locator('[data-testid="customer-clinic-id"]').textContent();
      expect(clinicId).toBe(TEST_CLINICS.clinic_2.id);
    }
  });

  test('Treatment and inventory isolation between clinics', async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Login as Clinic 1 staff
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
    
    // Check treatments available for Clinic 1
    await page.goto('/th/sales/treatments');
    const clinic1Treatments = await page.locator('[data-testid="treatment-item"]').allTextContents();
    
    // Check inventory access
    await page.goto('/th/sales/inventory');
    const clinic1Inventory = await page.locator('[data-testid="inventory-item"]').count();
    
    await authPage.logout();
    
    // Login as Clinic 2 staff
    await authPage.login(TEST_USERS.sales_staff_2.email, TEST_USERS.sales_staff_2.password);
    await authPage.expectSuccessfulLogin();
    
    // Check treatments available for Clinic 2
    await page.goto('/th/sales/treatments');
    const clinic2Treatments = await page.locator('[data-testid="treatment-item"]').allTextContents();
    
    // Should have different treatment sets
    expect(clinic1Treatments).not.toEqual(clinic2Treatments);
    
    // Check inventory access
    await page.goto('/th/sales/inventory');
    const clinic2Inventory = await page.locator('[data-testid="inventory-item"]').count();
    
    // Should have different inventory counts
    expect(clinic1Inventory).not.toBe(clinic2Inventory);
  });

  test('AI quota isolation and usage tracking', async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Test Clinic 1 quota
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
    
    await page.goto('/th/sales');
    const clinic1Quota = await page.locator('[data-testid="quota-usage"]').textContent();
    const clinic1Usage = parseInt(clinic1Quota?.split('/')[0] || '0');
    const clinic1Limit = parseInt(clinic1Quota?.split('/')[1] || '0');
    
    expect(clinic1Limit).toBe(TEST_CLINICS.clinic_1.quota);
    
    await authPage.logout();
    
    // Test Clinic 2 quota
    await authPage.login(TEST_USERS.sales_staff_2.email, TEST_USERS.sales_staff_2.password);
    await authPage.expectSuccessfulLogin();
    
    await page.goto('/th/sales');
    const clinic2Quota = await page.locator('[data-testid="quota-usage"]').textContent();
    const clinic2Usage = parseInt(clinic2Quota?.split('/')[0] || '0');
    const clinic2Limit = parseInt(clinic2Quota?.split('/')[1] || '0');
    
    expect(clinic2Limit).toBe(TEST_CLINICS.clinic_2.quota);
    
    // Quotas should be independent
    expect(clinic1Usage).not.toBe(clinic2Usage);
    expect(clinic1Limit).not.toBe(clinic2Limit);
  });

  test('Cross-clinic data access prevention', async ({ page }) => {
    authPage = new AuthPage(page);
    
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
    
    // Try to access clinic 2's data via direct URL manipulation
    await page.goto(`/th/clinic/customers?clinic_id=${TEST_CLINICS.clinic_2.id}`);
    
    // Should either redirect or show empty/error state
    await page.waitForLoadState('networkidle');
    
    // Verify no unauthorized data is displayed
    const unauthorizedData = page.locator('[data-testid="customer-row"]');
    const count = await unauthorizedData.count();
    
    // Should show no data or proper access denied message
    if (count === 0) {
      await expect(page.locator('[data-testid="no-data-message"]')).toBeVisible();
    } else {
      // If data is shown, verify it belongs to the correct clinic
      for (let i = 0; i < count; i++) {
        const clinicId = await unauthorizedData.nth(i).locator('[data-testid="customer-clinic-id"]').textContent();
        expect(clinicId).toBe(TEST_CLINICS.clinic_1.id);
      }
    }
  });

  test('Super Admin access to all clinic data', async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    
    await authPage.goto();
    await authPage.login(TEST_USERS.super_admin.email, TEST_USERS.super_admin.password);
    await authPage.expectSuccessfulLogin();
    
    await page.goto('/th/admin');
    
    // Super admin should see clinic selector
    await expect(dashboardPage.clinicSelector).toBeVisible();
    
    // Test switching between clinics
    await dashboardPage.selectClinic(TEST_CLINICS.clinic_1.name);
    await page.goto('/th/admin/customers');
    const clinic1Customers = await page.locator('[data-testid="customer-row"]').count();
    
    await dashboardPage.selectClinic(TEST_CLINICS.clinic_2.name);
    await page.goto('/th/admin/customers');
    const clinic2Customers = await page.locator('[data-testid="customer-row"]').count();
    
    // Should see different customer counts
    expect(clinic1Customers).not.toBe(clinic2Customers);
    
    // Test 'All Clinics' view
    await dashboardPage.selectClinic('All Clinics');
    await page.goto('/th/admin/analytics');
    
    // Should see aggregated data from all clinics
    await expect(page.locator('[data-testid="total-clinics-count"]')).toContainText('2');
    
    const totalRevenue = await page.locator('[data-testid="total-revenue"]').textContent();
    expect(parseInt(totalRevenue?.replace(/[^\d]/g, '') || '0')).toBeGreaterThan(0);
  });

  test('Branch-level data isolation within clinics', async ({ page }) => {
    authPage = new AuthPage(page);
    
    await authPage.goto();
    await authPage.login(TEST_USERS.clinic_owner_1.email, TEST_USERS.clinic_owner_1.password);
    await authPage.expectSuccessfulLogin();
    
    // Navigate to branch management
    await page.goto('/th/clinic/branches');
    
    // Verify branch selector is available
    await expect(page.locator('[data-testid="branch-selector"]')).toBeVisible();
    
    // Select first branch
    await page.selectOption('[data-testid="branch-selector"]', '0');
    await page.goto('/th/clinic/staff');
    const branch1Staff = await page.locator('[data-testid="staff-member"]').count();
    
    // Select second branch
    await page.selectOption('[data-testid="branch-selector"]', '1');
    await page.goto('/th/clinic/staff');
    const branch2Staff = await page.locator('[data-testid="staff-member"]').count();
    
    // Different branches should have different staff counts
    expect(branch1Staff).not.toBe(branch2Staff);
    
    // Test appointment isolation
    await page.selectOption('[data-testid="branch-selector"]', '0');
    await page.goto('/th/clinic/appointments');
    const branch1Appointments = await page.locator('[data-testid="appointment-row"]').count();
    
    await page.selectOption('[data-testid="branch-selector"]', '1');
    await page.goto('/th/clinic/appointments');
    const branch2Appointments = await page.locator('[data-testid="appointment-row"]').count();
    
    // Should show different appointment sets
    expect(branch1Appointments).not.toBe(branch2Appointments);
  });

  test('Data export restrictions and audit logs', async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Test as regular staff member
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
    
    await page.goto('/th/sales/customers');
    
    // Regular staff should have limited export options
    await page.click('[data-testid="export-menu-btn"]');
    
    // Should not have full database export
    await expect(page.locator('[data-testid="export-all-data"]')).not.toBeVisible();
    
    // Should have limited customer export only
    await expect(page.locator('[data-testid="export-customer-list"]')).toBeVisible();
    
    await page.click('[data-testid="export-customer-list"]');
    
    // Should require justification
    await expect(page.locator('[data-testid="export-justification"]')).toBeVisible();
    await page.fill('[data-testid="export-justification"]', 'Monthly follow-up campaign');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="confirm-export-btn"]')
    ]);
    
    expect(download.suggestedFilename()).toMatch(/customers.*\.csv$/);
    
    await authPage.logout();
    
    // Test audit log as clinic owner
    await authPage.login(TEST_USERS.clinic_owner_1.email, TEST_USERS.clinic_owner_1.password);
    await authPage.expectSuccessfulLogin();
    
    await page.goto('/th/clinic/audit-logs');
    
    // Should see the export action in audit logs
    await expect(page.locator('[data-testid="audit-entry"]').first())
      .toContainText('Customer data exported');
    
    // Verify audit entry details
    const auditEntry = page.locator('[data-testid="audit-entry"]').first();
    await expect(auditEntry.locator('[data-testid="audit-user"]'))
      .toContainText(TEST_USERS.sales_staff_1.email);
    await expect(auditEntry.locator('[data-testid="audit-action"]'))
      .toContainText('EXPORT');
    await expect(auditEntry.locator('[data-testid="audit-resource"]'))
      .toContainText('customers');
  });

  test('Database RLS policy enforcement verification', async ({ page }) => {
    // This test would ideally check database policies directly
    // For now, we'll verify through UI behavior
    
    authPage = new AuthPage(page);
    
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
    
    // Create a customer
    await page.goto('/th/sales/customers/new');
    await page.fill('[data-testid="customer-name"]', 'RLS Test Customer');
    await page.fill('[data-testid="customer-email"]', 'rls-test@example.com');
    await page.fill('[data-testid="customer-phone"]', '0899999999');
    await page.click('[data-testid="save-customer-btn"]');
    
    await expect(page.locator('[data-testid="customer-saved"]')).toBeVisible();
    
    // Get customer ID
    const customerId = await page.locator('[data-testid="customer-id"]').textContent();
    
    await authPage.logout();
    
    // Try to access this customer from different clinic
    await authPage.login(TEST_USERS.sales_staff_2.email, TEST_USERS.sales_staff_2.password);
    await authPage.expectSuccessfulLogin();
    
    // Direct navigation to customer should fail
    await page.goto(`/th/sales/customers/${customerId}`);
    
    // Should show not found or access denied
    await expect(page.locator('h1')).toContainText(/Not Found|Access Denied|404/i);
    
    // Customer shouldn't appear in search
    await page.goto('/th/sales/customers');
    await page.fill('[data-testid="customer-search"]', 'RLS Test Customer');
    await page.click('[data-testid="search-btn"]');
    
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
  });
});
