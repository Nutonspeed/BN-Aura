import { defineConfig, devices } from '@playwright/test';

/**
 * BN-Aura E2E Testing Configuration
 * Multi-tenant aesthetic clinic management platform testing setup
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputDir: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Desktop Chrome - Primary testing browser
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          // Enable permissions for camera (needed for Magic Scan)
          permissions: ['camera', 'microphone'],
        }
      },
    },

    // Firefox for cross-browser compatibility
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Safari for webkit testing
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // iPad testing (clinic staff primarily use tablets)
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        contextOptions: {
          permissions: ['camera'],
        }
      },
    },

    // Mobile testing for customer portal
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },

    // Authentication setup tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
  ],

  // Global test settings
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),

  // Web server for testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
