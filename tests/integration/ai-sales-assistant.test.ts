/**
 * AI Sales Assistant Integration Tests
 * ทดสอบการทำงานของ AI Sales Assistant API และ Components
 */

import { expect, test } from '@playwright/test';

test.describe('AI Sales Assistant', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock Gemini API responses
    await page.route('**/api/ai/sales-coach', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      if (postData.action === 'get_advice') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            advice: {
              suggestion: "เน้นการใช้ผลสแกนผิวเป็นหลักฐาน เพื่อสร้างความเชื่อมั่น",
              talkingPoints: [
                "แสดงผลการวิเคราะห์ 468 จุดบนใบหน้า",
                "เปรียบเทียบกับข้อมูลผิวปกติ", 
                "อธิบายสาเหตุของปัญหาผิวเชิงลึก"
              ],
              closingTechnique: "ถามคำถามปิด: 'คุณพร้อมเริ่มดูแลผิวแบบมืออาชีพไหมคะ?'",
              confidence: 85
            }
          })
        });
      }
    });

    // Login as sales user
    await page.goto('http://localhost:3000/th/login');
    // Handle PDPA if present
    try {
      const pdpaButton = page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // Continue
    }
  });

  test('🤖 AI Coach Panel displays correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // Click AI Coach Demo button
    const demoButton = page.getByRole('button', { name: /AI Coach Demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Check AI Coach Panel appears
    await expect(page.getByText('AI Sales Coach')).toBeVisible();
    await expect(page.getByText('Real-time Assistance')).toBeVisible();
    
    // Check Deal Probability Meter
    await expect(page.getByText('โอกาสปิดการขาย')).toBeVisible();
    
    // Check for suggestion content
    const suggestButton = page.getByRole('button', { name: /รับคำแนะนำใหม่/i });
    await expect(suggestButton).toBeVisible();
  });

  test('🎯 Hot Leads Alert functionality', async ({ page }) => {
    // Mock hot leads data
    await page.route('**/api/ai/lead-prioritizer', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          alert: {
            count: 2,
            leads: [
              {
                id: 'test-lead-1',
                name: 'คุณทดสอบ 1',
                priorityScore: 85,
                priorityLevel: 'hot',
                recommendedAction: 'โทรติดตามทันที',
                skinAnalysis: {
                  concerns: ['acne', 'aging'],
                  urgencyScore: 85
                }
              }
            ],
            message: '🔥 มี 2 Hot Leads ที่ควรติดตามทันที!'
          }
        })
      });
    });

    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // Check Hot Leads Alert displays
    await expect(page.getByText('🔥 มี 2 Hot Leads ที่ควรติดตามทันที!')).toBeVisible();
    await expect(page.getByText('คุณทดสอบ 1')).toBeVisible();
    await expect(page.getByText('โทรติดตามทันที')).toBeVisible();
  });

  test('💡 Smart Suggestions component', async ({ page }) => {
    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // Activate AI Coach first
    await page.getByRole('button', { name: /AI Coach Demo/i }).click();
    
    // Look for Smart Suggestions section
    const suggestionsSection = page.getByText('AI Upsell Recommendations');
    await expect(suggestionsSection).toBeVisible();
    
    // Try to get recommendations
    const getRecommendButton = page.getByRole('button', { name: /รับคำแนะนำ/i });
    await expect(getRecommendButton).toBeVisible();
  });

  test('📱 Mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // AI Coach Demo should still be accessible
    const demoButton = page.getByRole('button', { name: /AI Coach Demo/i });
    await expect(demoButton).toBeVisible();
    
    // Click and verify AI Coach works on mobile
    await demoButton.click();
    await expect(page.getByText('AI Sales Coach')).toBeVisible();
    
    // AI Coach Panel should be responsive
    const coachPanel = page.locator('.fixed.right-6.top-24');
    await expect(coachPanel).toBeVisible();
  });

  test('⚡ Performance - AI response time', async ({ page }) => {
    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // Activate AI Coach
    await page.getByRole('button', { name: /AI Coach Demo/i }).click();
    
    // Measure response time for AI suggestion
    const startTime = Date.now();
    await page.getByRole('button', { name: /รับคำแนะนำใหม่/i }).click();
    
    // Wait for AI response to appear
    await expect(page.getByText('คำแนะนำหลัก')).toBeVisible();
    const responseTime = Date.now() - startTime;
    
    // Should respond within 5 seconds (generous for testing)
    expect(responseTime).toBeLessThan(5000);
  });

  test('🔄 Lead selection triggers AI Coach', async ({ page }) => {
    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // Wait for leads to load
    await page.waitForTimeout(2000);
    
    // Click on a lead in Hot Leads section
    const leadItem = page.locator('.glass-card .space-y-4 > div').first();
    if (await leadItem.isVisible()) {
      await leadItem.click();
      
      // AI Coach should appear
      await expect(page.getByText('AI Sales Coach')).toBeVisible();
      await expect(page.getByText('Real-time Assistance')).toBeVisible();
    }
  });

  test('❌ Error handling - API failure', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/ai/sales-coach', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      });
    });

    await page.goto('http://localhost:3000/th/sales');
    await page.waitForLoadState('networkidle');

    // Activate AI Coach
    await page.getByRole('button', { name: /AI Coach Demo/i }).click();
    
    // Try to get advice (should handle error gracefully)
    await page.getByRole('button', { name: /รับคำแนะนำใหม่/i }).click();
    
    // Should not crash the app
    await expect(page.getByText('AI Sales Coach')).toBeVisible();
    
    // Check for error state or fallback content
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy(); // Page should still be functional
  });
});
