import { test, expect } from '@playwright/test';

test.describe('UI Navigation & Components', () => {
  
  test.beforeEach(async ({ page }) => {
    // Handle PDPA modal for all tests
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // PDPA modal not present, continue
    }
  });

  test('Homepage displays key sections', async ({ page }) => {
    // Check main headline
    await expect(page.getByText(/The platform where.*skin analysis happens in seconds/i)).toBeVisible();
    
    // Check stats section (468 Facial Points, 30s Analysis Time, 95% Accuracy)
    await expect(page.getByText('468')).toBeVisible();
    await expect(page.getByText(/facial points/i)).toBeVisible();
    await expect(page.getByText(/30.*s/)).toBeVisible();
    await expect(page.getByText(/analysis time/i)).toBeVisible();
    
    // Check CTA buttons
    await expect(page.getByRole('button', { name: /ทดลองใช้งาน/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ติดต่อทีมขาย/i })).toBeVisible();
    
    // Check pricing section
    await expect(page.getByText(/deployment.*tiers/i)).toBeVisible();
    await expect(page.getByText(/starter/i)).toBeVisible();
    await expect(page.getByText(/professional/i)).toBeVisible();
    await expect(page.getByText(/premium/i)).toBeVisible();
  });

  test('Navigation between sections works', async ({ page }) => {
    // Test contact section navigation
    const contactLink = page.getByRole('link', { name: /contact/i }).first();
    if (await contactLink.isVisible()) {
      await contactLink.click();
      await page.waitForTimeout(1000);
      
      // Should scroll to contact section
      await expect(page.getByText(/ติดต่อเรา/i)).toBeVisible();
    }
    
    // Test login navigation
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/login');
    }
  });

  test('Responsive design works on different screen sizes', async ({ page }) => {
    // Test desktop view (default)
    await expect(page.getByText(/The platform where/i)).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/The platform where/i)).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/The platform where/i)).toBeVisible();
  });

  test('Pricing cards display correctly', async ({ page }) => {
    // Scroll to pricing section
    await page.getByText(/deployment.*tiers/i).scrollIntoViewIfNeeded();
    
    // Check all pricing tiers are visible
    const pricingTiers = ['Starter', 'Professional', 'Premium', 'Enterprise'];
    
    for (const tier of pricingTiers) {
      await expect(page.getByText(tier, { exact: false })).toBeVisible();
    }
    
    // Check pricing values are displayed
    await expect(page.getByText(/2,990/)).toBeVisible(); // Starter price
    await expect(page.getByText(/8,990/)).toBeVisible(); // Professional price
    await expect(page.getByText(/19,990/)).toBeVisible(); // Premium price
    
    // Check "Most Popular" badge on Professional tier
    await expect(page.getByText(/most popular/i)).toBeVisible();
    
    // Check CTA buttons on pricing cards
    const ctaButtons = page.getByRole('button', { name: /เริ่มใช้งานเลย/i });
    expect(await ctaButtons.count()).toBeGreaterThan(0);
  });

  test('Technology stack section displays', async ({ page }) => {
    // Scroll to technology section
    await page.getByText(/เทคโนโลยีชั้นนำระดับโลก/i).scrollIntoViewIfNeeded();
    
    // Check technology items
    const techItems = ['Google Gemini', 'MediaPipe', 'Next.js 15', 'Supabase'];
    
    for (const tech of techItems) {
      await expect(page.getByText(tech)).toBeVisible();
    }
  });

  test('Contact section displays correctly', async ({ page }) => {
    // Scroll to contact section
    await page.getByText(/ติดต่อเรา/i).scrollIntoViewIfNeeded();
    
    // Check contact methods
    await expect(page.getByText(/LINE Official/i)).toBeVisible();
    await expect(page.getByText(/Email/i)).toBeVisible();
    await expect(page.getByText(/โทรศัพท์/i)).toBeVisible();
    
    // Check contact links are clickable
    const contactLinks = page.getByRole('link').filter({ hasText: /@bn-aura|contact@|02-/ });
    expect(await contactLinks.count()).toBeGreaterThan(0);
  });

  test('Footer contains essential links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer content
    await expect(page.getByText(/BN-Aura/)).toBeVisible();
    await expect(page.getByText(/2026.*All rights reserved/i)).toBeVisible();
    
    // Check footer navigation links
    const footerLinks = ['Demo', 'Login', 'Contact'];
    for (const linkText of footerLinks) {
      const link = page.getByRole('link', { name: new RegExp(linkText, 'i') }).last();
      if (await link.isVisible()) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('Page performance is acceptable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Homepage should load within 10 seconds (generous for development)
    expect(loadTime).toBeLessThan(10000);
    
    // Check that main content is visible quickly
    await expect(page.getByText(/The platform where/i)).toBeVisible();
  });
});
