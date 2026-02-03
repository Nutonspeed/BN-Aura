// Test APIs through browser automation
const { chromium } = require('playwright');

async function testBrowserAPIs() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/th/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'nuttapong161@gmail.com');
    await page.fill('input[type="password"]', '127995803');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/admin/**');
    
    console.log('✅ Login successful');
    
    // Navigate to support page
    await page.goto('http://localhost:3000/th/admin/support');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="support-tickets"]');
    
    // Get support tickets data
    const ticketsData = await page.evaluate(() => {
      return fetch('/api/admin/support/tickets')
        .then(response => response.json())
        .catch(error => ({ error: error.message }));
    });
    
    console.log('Support Tickets API Response:', ticketsData);
    
    // Test announcements API
    const announcementsData = await page.evaluate(() => {
      return fetch('/api/admin/announcements')
        .then(response => response.json())
        .catch(error => ({ error: error.message }));
    });
    
    console.log('Announcements API Response:', announcementsData);
    
    // Test system alerts API
    const alertsData = await page.evaluate(() => {
      return fetch('/api/admin/system/alerts')
        .then(response => response.json())
        .catch(error => ({ error: error.message }));
    });
    
    console.log('System Alerts API Response:', alertsData);
    
    // Test billing records API
    const billingData = await page.evaluate(() => {
      return fetch('/api/admin/billing/records')
        .then(response => response.json())
        .catch(error => ({ error: error.message }));
    });
    
    console.log('Billing Records API Response:', billingData);
    
  } catch (error) {
    console.error('Browser test error:', error);
  } finally {
    await browser.close();
  }
}

testBrowserAPIs();
