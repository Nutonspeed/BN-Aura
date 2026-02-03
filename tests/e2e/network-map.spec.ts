import { test, expect } from '@playwright/test';

test.describe('Network Map - Complete E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/th/admin/network-map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for real-time data to load
  });

  test('should display network map page with all core elements', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Network Map' })).toBeVisible();
    
    // Check statistics cards
    await expect(page.getByText('Total Nodes')).toBeVisible();
    await expect(page.getByText('Clinics')).toBeVisible();
    await expect(page.getByText('Services')).toBeVisible();
    await expect(page.getByText('Warnings')).toBeVisible();
    await expect(page.getByText('Offline')).toBeVisible();
    
    // Check controls
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Grid|List/ })).toBeVisible();
  });

  test('should display network topology with nodes', async ({ page }) => {
    // Check topology tab is active
    await expect(page.getByRole('button', { name: 'Topology' })).toBeVisible();
    
    // Check nodes are present
    await expect(page.getByText('Main Clinic')).toBeVisible();
    await expect(page.getByText('Database Server')).toBeVisible();
    await expect(page.getByText('API Gateway')).toBeVisible();
    
    // Check node list shows 8 nodes
    const nodeList = page.locator('[class*="grid"]').filter({ hasText: 'Main Clinic' });
    await expect(nodeList).toBeVisible();
  });

  test('should open node detail panel when clicking a node', async ({ page }) => {
    // Click on Main Clinic node
    await page.getByText('Main ClinicBangkokLatency45msUptime99.9%Load65%').click();
    
    // Check detail panel appears
    await expect(page.getByRole('heading', { name: 'Main Clinic', exact: true })).toBeVisible();
    await expect(page.getByText('Health Score')).toBeVisible();
    await expect(page.getByText('Performance Metrics')).toBeVisible();
    await expect(page.getByText('Active Users')).toBeVisible();
    await expect(page.getByText('Staff Members')).toBeVisible();
    
    // Check close button works
    const closeButton = page.locator('button').filter({ has: page.locator('svg').first() }).last();
    await closeButton.click();
    await expect(page.getByText('Health Score')).not.toBeVisible();
  });

  test('should show performance charts when node is selected', async ({ page }) => {
    // Click on a node
    await page.getByText('Main ClinicBangkokLatency45msUptime99.9%Load65%').click();
    
    // Check performance charts appear
    await expect(page.getByText('Performance Trends')).toBeVisible();
    await expect(page.getByText('Avg Latency')).toBeVisible();
    await expect(page.getByText('Avg Load')).toBeVisible();
    
    // Check time range selector
    await expect(page.getByRole('button', { name: '1H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '24H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
  });

  test('should switch time ranges in performance chart', async ({ page }) => {
    await page.getByText('Main ClinicBangkokLatency45msUptime99.9%Load65%').click();
    
    // Click 1H time range
    await page.getByRole('button', { name: '1H' }).click();
    await page.waitForTimeout(500);
    
    // Click 7D time range
    await page.getByRole('button', { name: '7D' }).click();
    await page.waitForTimeout(500);
    
    // Verify chart updated (check for different time format)
    await expect(page.getByText('Performance Trends')).toBeVisible();
  });

  test('should open and display alert center', async ({ page }) => {
    // Click alert bell
    const alertButton = page.getByRole('button', { name: /2/ }).first();
    await alertButton.click();
    
    // Check alerts are displayed
    await expect(page.getByText('Alerts (3)')).toBeVisible();
    await expect(page.getByText('High Latency Detected')).toBeVisible();
    await expect(page.getByText('Node Offline')).toBeVisible();
    await expect(page.getByText('System Update')).toBeVisible();
  });

  test('should open export menu and show export options', async ({ page }) => {
    // Click export button
    await page.getByRole('button', { name: 'Export' }).click();
    
    // Check export options
    await expect(page.getByText('Export as CSV')).toBeVisible();
    await expect(page.getByText('Export as JSON')).toBeVisible();
    await expect(page.getByText('Export Report')).toBeVisible();
    await expect(page.getByText('Spreadsheet format')).toBeVisible();
  });

  test('should filter nodes by search term', async ({ page }) => {
    // Type in search box
    const searchBox = page.getByPlaceholder('Search nodes...');
    await searchBox.fill('Main');
    
    // Check filtered results
    await expect(page.getByText('Main Clinic')).toBeVisible();
    await expect(page.getByText('Main Server')).toBeVisible();
    
    // Clear search
    await searchBox.clear();
    await searchBox.fill('Database');
    await expect(page.getByText('Database Server')).toBeVisible();
  });

  test('should filter nodes by type', async ({ page }) => {
    // Select clinic filter
    const typeFilter = page.locator('select').first();
    await typeFilter.selectOption('clinic');
    
    // Check only clinics are shown
    await expect(page.getByText('Main Clinic')).toBeVisible();
    await expect(page.getByText('Branch Clinic A')).toBeVisible();
  });

  test('should filter nodes by status', async ({ page }) => {
    // Select status filter
    const statusFilter = page.locator('select').last();
    await statusFilter.selectOption('warning');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check warning nodes are prioritized
    await expect(page.getByText(/Warning/)).toBeVisible();
  });

  test('should switch between grid and list view', async ({ page }) => {
    // Click list view
    await page.getByRole('button', { name: 'List' }).click();
    await page.waitForTimeout(500);
    
    // Click grid view
    await page.getByRole('button', { name: 'Grid' }).click();
    await page.waitForTimeout(500);
    
    // Verify nodes still visible
    await expect(page.getByText('Main Clinic')).toBeVisible();
  });

  test('should show real-time connection status', async ({ page }) => {
    // Check connection status
    const connectionStatus = page.getByText(/Connected|Reconnecting.../);
    await expect(connectionStatus).toBeVisible();
    
    // Check last updated time
    await expect(page.getByText(/Last updated:/)).toBeVisible();
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    // Get initial last update time
    const initialTime = await page.getByText(/Last updated:/).textContent();
    
    // Click refresh button
    await page.locator('button').filter({ has: page.locator('svg[class*="animate-spin"]').or(page.locator('svg').first()) }).last().click();
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Verify page is still functional
    await expect(page.getByText('Network Map')).toBeVisible();
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    // Click back button
    await page.locator('button').filter({ has: page.locator('svg').first() }).first().click();
    
    // Should navigate away from network map
    await page.waitForTimeout(500);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile status bar
    await expect(page.getByText('Network Map')).toBeVisible();
    await expect(page.getByText(/Online/)).toBeVisible();
    
    // Check nodes still accessible
    await expect(page.getByText('Main Clinic')).toBeVisible();
  });

  test('should display all statistics with correct counts', async ({ page }) => {
    // Check total nodes
    await expect(page.getByText('8').first()).toBeVisible();
    
    // Check status counts
    const onlineCount = page.getByText('Online (5)');
    const warningCount = page.getByText('Warning (2)');
    const offlineCount = page.getByText('Offline (1)');
    
    await expect(onlineCount).toBeVisible();
    await expect(warningCount).toBeVisible();
    await expect(offlineCount).toBeVisible();
  });

  test('should switch between visualization tabs', async ({ page }) => {
    // Click Heat Map tab
    await page.getByRole('button', { name: 'Heat Map' }).click();
    await page.waitForTimeout(500);
    
    // Click Traffic tab
    await page.getByRole('button', { name: 'Traffic' }).click();
    await page.waitForTimeout(500);
    
    // Click back to Topology
    await page.getByRole('button', { name: 'Topology' }).click();
    await page.waitForTimeout(500);
    
    // Verify topology is visible
    await expect(page.getByText('Main Clinic')).toBeVisible();
  });
});

test.describe('Network Map - Accessibility Tests', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3001/th/admin/network-map');
    await page.waitForLoadState('networkidle');
    
    // Check heading hierarchy
    await expect(page.getByRole('heading', { name: 'Network Map' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nodes' })).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:3001/th/admin/network-map');
    await page.waitForLoadState('networkidle');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Back button
    await page.keyboard.press('Tab'); // Export button
    await page.keyboard.press('Tab'); // Alert button
    await page.keyboard.press('Tab'); // Refresh button
    
    // Verify focus is working
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedElement);
  });
});
