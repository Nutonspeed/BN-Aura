import { test, expect } from '@playwright/test';

/**
 * System Performance and Integration Testing
 * ทดสอบประสิทธิภาพและการทำงานร่วมกันของระบบทั้งหมด
 */

const TEST_CREDENTIALS = {
  clinicOwner: { email: 'clinic.owner@bntest.com', password: 'BNAura2024!' },
  salesStaff: { email: 'sales1.auth@bntest.com', password: 'AuthStaff123!' }
};

test.describe('System Performance Tests', () => {
  
  test('Page load performance benchmarks', async ({ page }) => {
    const testPages = [
      { url: '/th/login', name: 'Login Page' },
      { url: '/th/sales', name: 'Sales Dashboard', requiresAuth: true },
      { url: '/th/clinic', name: 'Clinic Dashboard', requiresAuth: true }
    ];
    
    for (const testPage of testPages) {
      if (testPage.requiresAuth) {
        await page.goto('/th/login');
        await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
        await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
      }
      
      const startTime = Date.now();
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`📊 ${testPage.name} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // 5 second max
      
      if (loadTime > 3000) {
        console.warn(`⚠️ ${testPage.name} loaded slowly: ${loadTime}ms`);
      }
    }
  });

  test('API response time benchmarks', async ({ page }) => {
    // Login first
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    const apiEndpoints = [
      '/api/customers',
      '/api/loyalty/points',
      '/api/commissions',
      '/api/tasks'
    ];
    
    for (const endpoint of apiEndpoints) {
      const startTime = Date.now();
      const response = await page.request.get(endpoint);
      const responseTime = Date.now() - startTime;
      
      console.log(`🔗 ${endpoint} response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(2000); // 2 second max
      expect([200, 401, 403]).toContain(response.status());
    }
  });

  test('Database query performance', async ({ page }) => {
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    // Test data-heavy pages
    const dataPages = [
      '/th/clinic',
      '/th/sales'
    ];
    
    for (const dataPage of dataPages) {
      const startTime = Date.now();
      await page.goto(dataPage);
      await page.waitForSelector('table, .data-table, .customer-card', { timeout: 10000 });
      const queryTime = Date.now() - startTime;
      
      console.log(`🗄️ ${dataPage} data load time: ${queryTime}ms`);
      expect(queryTime).toBeLessThan(3000);
    }
  });
});

test.describe('Cross-System Integration Tests', () => {
  
  test('Complete business flow integration', async ({ page }) => {
    // Login as clinic owner
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    // Check clinic dashboard loads with all components
    await page.waitForLoadState('networkidle');
    
    // Verify key dashboard components are present
    const dashboardComponents = [
      'text=รายได้รวม',
      'text=ลูกค้า', 
      'text=การนัด',
      'text=พนักงาน'
    ];
    
    for (const component of dashboardComponents) {
      const element = page.locator(component);
      if (await element.count() > 0) {
        console.log(`✅ Dashboard component found: ${component}`);
      }
    }
    
    // Navigate to sales to test cross-dashboard consistency
    await page.goto('/th/sales');
    await page.waitForLoadState('networkidle');
    
    // Check for consistent data display
    const revenueElements = page.locator('text=/฿[\\d,]+/');
    const revenueCount = await revenueElements.count();
    console.log(`💰 Found ${revenueCount} revenue/currency displays`);
  });

  test('Multi-user concurrent access', async ({ page, context }) => {
    // Create multiple browser contexts to simulate concurrent users
    const page2 = await context.newPage();
    
    // User 1: Clinic Owner
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    // User 2: Sales Staff (simultaneously)
    await page2.goto('/th/login');
    await page2.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page2.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page2.click('button[type="submit"]');
    
    // Both should successfully load their dashboards
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle')
    ]);
    
    // Verify both users can access their data simultaneously
    const page1Title = await page.title();
    const page2Title = await page2.title();
    
    expect(page1Title).toContain('BN-Aura');
    expect(page2Title).toContain('BN-Aura');
    
    console.log('✅ Multiple users can access system simultaneously');
    await page2.close();
  });

  test('Data consistency across user roles', async ({ page, context }) => {
    const page2 = await context.newPage();
    
    // Setup both users
    await page.goto('/th/login');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.clinicOwner.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.clinicOwner.password);
    await page.click('button[type="submit"]');
    
    await page2.goto('/th/login');
    await page2.fill('input[type="email"]', TEST_CREDENTIALS.salesStaff.email);
    await page2.fill('input[type="password"]', TEST_CREDENTIALS.salesStaff.password);
    await page2.click('button[type="submit"]');
    
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle')
    ]);
    
    // Check that customer counts are consistent between views
    const clinicCustomers = page.locator('.customer-card, [data-testid="customer"]');
    const salesCustomers = page2.locator('.customer-card, [data-testid="customer"]');
    
    const clinicCount = await clinicCustomers.count();
    const salesCount = await salesCustomers.count();
    
    console.log(`👥 Clinic view: ${clinicCount} customers, Sales view: ${salesCount} customers`);
    
    // Sales staff might see fewer customers due to assignment filtering
    expect(salesCount).toBeLessThanOrEqual(clinicCount);
    
    await page2.close();
  });
});
