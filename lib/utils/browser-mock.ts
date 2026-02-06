// Browser automation mock for v0 environment
// Puppeteer is not supported, so we provide mock implementations

export class BrowserMock {
  async launch(options?: any) {
    console.warn('[v0] Puppeteer not available - using mock browser');
    return new PageMock();
  }
}

export class PageMock {
  async newPage() {
    return this;
  }

  async goto(url: string, options?: any) {
    console.log(`[v0] Mock browser navigation to: ${url}`);
    return { status: () => 200 };
  }

  async screenshot(options?: any) {
    console.warn('[v0] Screenshot not available in mock browser');
    return Buffer.from('');
  }

  async pdf(options?: any) {
    console.warn('[v0] PDF generation not available in mock browser');
    return Buffer.from('');
  }

  async evaluate(fn: any, ...args: any[]) {
    console.warn('[v0] Page evaluation not available in mock browser');
    return null;
  }

  async close() {
    console.log('[v0] Mock browser closed');
  }

  async $eval(selector: string, fn: any, ...args: any[]) {
    console.warn('[v0] Element selection not available in mock browser');
    return null;
  }

  async $$eval(selector: string, fn: any, ...args: any[]) {
    console.warn('[v0] Element selection not available in mock browser');
    return [];
  }
}

/**
 * Get browser instance (mock in v0, real puppeteer in production)
 */
export async function getBrowser() {
  try {
    // Try to load puppeteer only in production
    if (process.env.NODE_ENV === 'production' && process.env.PUPPETEER_ENABLED === 'true') {
      const puppeteer = require('puppeteer');
      return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  } catch (error) {
    console.log('[v0] Puppeteer unavailable, using mock');
  }
  
  // Default to mock
  return new BrowserMock();
}

export default { getBrowser, BrowserMock, PageMock };
