import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - All Pages Test', () => {
  const adminPages = [
    { path: '/th/admin', name: 'Admin Dashboard Overview' },
    { path: '/th/admin/analytics', name: 'Analytics' },
    { path: '/th/admin/announcements', name: 'Announcements' },
    { path: '/th/admin/audit', name: 'Audit Trail' },
    { path: '/th/admin/billing', name: 'Billing' },
    { path: '/th/admin/broadcast', name: 'Broadcast' },
    { path: '/th/admin/clinics', name: 'Clinics Management' },
    { path: '/th/admin/permissions', name: 'Permissions' },
    { path: '/th/admin/security', name: 'Security' },
    { path: '/th/admin/settings', name: 'Settings' },
    { path: '/th/admin/support', name: 'Support' },
    { path: '/th/admin/system', name: 'System Monitoring' },
    { path: '/th/admin/users', name: 'Users' }
  ];

  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/th/auth/login');
    await page.fill('input[type="email"]', 'nuttapong161@gmail.com');
    await page.fill('input[type="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/th/admin');
  });

  test('Check all admin pages load without 404 errors', async ({ page }) => {
    const results = [];

    for (const pageConfig of adminPages) {
      console.log(`Testing: ${pageConfig.name}`);
      
      // Navigate to page
      const response = await page.goto(pageConfig.path);
      
      // Check for successful response
      const status = response?.status();
      const hasError = page.url().includes('/404') || page.url().includes('/error');
      
      results.push({
        page: pageConfig.name,
        path: pageConfig.path,
        status: status || 'unknown',
        success: !hasError && (status === 200 || status === 304),
        url: page.url()
      });

      // Wait a bit for any dynamic content
      await page.waitForTimeout(1000);
    }

    // Log results
    console.table(results);

    // Assert all pages loaded successfully
    const failedPages = results.filter(r => !r.success);
    if (failedPages.length > 0) {
      console.error('Failed pages:', failedPages);
    }
    
    expect(failedPages.length).toBe(0);
  });

  test('Check API endpoints for admin pages', async ({ page }) => {
    const apiEndpoints = [
      '/api/admin/system',
      '/api/admin/audit',
      '/api/admin/support',
      '/api/admin/announcements',
      '/api/admin/users',
      '/api/admin/clinics',
      '/api/admin/billing',
      '/api/admin/analytics'
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`Testing API: ${endpoint}`);
      
      const response = await page.request.get(`http://localhost:3000${endpoint}`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      console.log(`✓ ${endpoint} - Status: ${response.status()}`);
    }
  });
});
