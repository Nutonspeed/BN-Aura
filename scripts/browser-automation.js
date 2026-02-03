/**
 * Browser Automation Script - Alternative to Playwright MCP
 * ใช้ Puppeteer หรือ Playwright โดยตรงแทน MCP
 */

const puppeteer = require('puppeteer');

class BrowserAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      console.log('🚀 Starting Browser Automation...');
      this.browser = await puppeteer.launch({
        headless: false, // แสดง browser window
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      console.log('✅ Browser launched successfully');
      return true;
    } catch (error) {
      console.error('❌ Browser launch failed:', error.message);
      return false;
    }
  }

  async navigate(url) {
    try {
      console.log(`🌐 Navigating to: ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      const title = await this.page.title();
      console.log(`✅ Page loaded: ${title}`);
      return { success: true, title };
    } catch (error) {
      console.error(`❌ Navigation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async takeScreenshot(filename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = filename || `screenshot-${timestamp}.png`;
      
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      return { success: true, path: screenshotPath };
    } catch (error) {
      console.error(`❌ Screenshot failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async click(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      console.log(`✅ Clicked: ${selector}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Click failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async type(selector, text) {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.type(selector, text);
      console.log(`✅ Typed "${text}" into: ${selector}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Type failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async waitForSelector(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      console.log(`✅ Element found: ${selector}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Element not found: ${selector}`);
      return { success: false, error: error.message };
    }
  }

  async getPageContent() {
    try {
      const content = await this.page.content();
      const title = await this.page.title();
      const url = this.page.url();
      
      return {
        success: true,
        title,
        url,
        contentLength: content.length,
        content: content.substring(0, 1000) // First 1000 chars
      };
    } catch (error) {
      console.error(`❌ Get content failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async evaluateScript(script) {
    try {
      const result = await this.page.evaluate(script);
      console.log('✅ Script executed successfully');
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Script execution failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Browser closed');
      }
    } catch (error) {
      console.error(`❌ Browser close failed: ${error.message}`);
    }
  }

  // Sequential Testing Methods
  async testLogin(email, password) {
    console.log(`\n🔐 Testing Login: ${email}`);
    
    try {
      // Navigate to login page
      await this.navigate('http://localhost:3000/th/login');
      
      // Wait for login form
      await this.waitForSelector('input[type="email"]');
      await this.waitForSelector('input[type="password"]');
      
      // Fill login form
      await this.type('input[type="email"]', email);
      await this.type('input[type="password"]', password);
      
      // Submit form
      await this.click('button[type="submit"]');
      
      // Wait for redirect or error
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUrl = this.page.url();
      const title = await this.page.title();
      
      console.log(`✅ Login test completed`);
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Page Title: ${title}`);
      
      return {
        success: !currentUrl.includes('/login'),
        url: currentUrl,
        title
      };
      
    } catch (error) {
      console.error(`❌ Login test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testDashboard(dashboardPath) {
    console.log(`\n📊 Testing Dashboard: ${dashboardPath}`);
    
    try {
      await this.navigate(`http://localhost:3000${dashboardPath}`);
      
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const content = await this.getPageContent();
      const screenshot = await this.takeScreenshot(`dashboard-${dashboardPath.replace(/\//g, '-')}.png`);
      
      console.log(`✅ Dashboard test completed`);
      console.log(`   Title: ${content.title}`);
      console.log(`   Content Length: ${content.contentLength} chars`);
      
      return {
        success: true,
        title: content.title,
        contentLength: content.contentLength,
        screenshot: screenshot.path
      };
      
    } catch (error) {
      console.error(`❌ Dashboard test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

// Export for use
module.exports = BrowserAutomation;

// Run if called directly
if (require.main === module) {
  async function runBrowserTest() {
    const browser = new BrowserAutomation();
    
    try {
      // Initialize browser
      const initialized = await browser.init();
      if (!initialized) {
        console.error('❌ Failed to initialize browser');
        return;
      }
      
      // Test navigation
      await browser.navigate('http://localhost:3000/th');
      await browser.takeScreenshot('homepage.png');
      
      // Test login (if login page exists)
      try {
        await browser.testLogin('testclinicowner2024@10minutemail.com', 'BNAura2024!');
      } catch (error) {
        console.log('⚠️ Login test skipped:', error.message);
      }
      
      // Test dashboards
      const dashboards = [
        '/th/clinic',
        '/th/clinic/appointments',
        '/th/clinic/pos',
        '/th/clinic/treatments'
      ];
      
      for (const dashboard of dashboards) {
        try {
          await browser.testDashboard(dashboard);
        } catch (error) {
          console.log(`⚠️ Dashboard ${dashboard} test failed:`, error.message);
        }
      }
      
      console.log('\n🎉 Browser testing completed!');
      
    } catch (error) {
      console.error('❌ Browser testing failed:', error);
    } finally {
      await browser.close();
    }
  }
  
  runBrowserTest();
}
