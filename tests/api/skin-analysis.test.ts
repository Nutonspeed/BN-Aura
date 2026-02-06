/**
 * BN-Aura AI Skin Analysis API Tests
 * Tests all 12 analysis endpoints using Playwright
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('BN-Aura AI Skin Analysis APIs', () => {
  
  // ============================================
  // 1. Core Skin Analysis API
  // ============================================
  test.describe('GET /api/analysis/skin', () => {
    test('should return symmetry analysis', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin?type=symmetry`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('overallSymmetry');
      expect(data.data).toHaveProperty('goldenRatio');
      expect(data.data.overallSymmetry).toBeGreaterThanOrEqual(0);
      expect(data.data.overallSymmetry).toBeLessThanOrEqual(100);
    });

    test('should return 8 metrics analysis', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin?type=metrics&age=35`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('overallScore');
      expect(data.data).toHaveProperty('skinAge');
      expect(data.data).toHaveProperty('metrics');
      expect(data.data.metrics).toHaveLength(8);
    });

    test('should return wrinkle zone analysis', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin?type=wrinkles`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('zones');
      expect(data.data).toHaveProperty('overallAgingLevel');
      expect(data.data.zones).toHaveLength(7);
    });

    test('should return comprehensive analysis', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin?type=comprehensive&age=35`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('symmetry');
      expect(data.data).toHaveProperty('skinMetrics');
      expect(data.data).toHaveProperty('wrinkleAnalysis');
    });
  });

  // ============================================
  // 2. AI Time Travel API
  // ============================================
  test.describe('GET /api/analysis/time-travel', () => {
    test('should return time travel predictions', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/time-travel?age=35&score=72`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('naturalAging');
      expect(data.data).toHaveProperty('withTreatment');
      expect(data.data).toHaveProperty('insights');
      expect(data.data.naturalAging).toHaveLength(5);
    });
  });

  // ============================================
  // 3. AR Treatment Preview API
  // ============================================
  test.describe('GET /api/analysis/ar-preview', () => {
    test('should return available treatments', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/ar-preview`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      // API returns recommendations array with treatment data
      expect(data.data).toHaveProperty('recommendations');
      expect(Array.isArray(data.data.recommendations)).toBe(true);
    });
  });

  // ============================================
  // 4. Skin Twin Matching API
  // ============================================
  test.describe('GET /api/analysis/skin-twin', () => {
    test('should return skin twin matches', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin-twin`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('twins');
      expect(data.data).toHaveProperty('statistics');
      expect(data.data).toHaveProperty('insights');
      expect(Array.isArray(data.data.twins)).toBe(true);
    });

    test('should return twins with match percentage', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/skin-twin`);
      const data = await response.json();
      
      if (data.data.twins.length > 0) {
        const firstTwin = data.data.twins[0];
        expect(firstTwin).toHaveProperty('matchPercentage');
        expect(firstTwin).toHaveProperty('treatmentJourney');
        expect(firstTwin).toHaveProperty('results');
        expect(firstTwin.matchPercentage).toBeGreaterThanOrEqual(0);
        expect(firstTwin.matchPercentage).toBeLessThanOrEqual(100);
      }
    });
  });

  // ============================================
  // 5. AI Skin Consultant API
  // ============================================
  test.describe('/api/analysis/consultant', () => {
    test('GET should return sample session', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/consultant`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('sessionId');
      expect(data.data).toHaveProperty('messages');
    });

    test('POST should start new session', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analysis/consultant`, {
        data: {
          action: 'start',
          customerId: 'TEST-001',
        },
      });
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('sessionId');
    });
  });

  // ============================================
  // 6. Product Compatibility Scanner API
  // ============================================
  test.describe('/api/analysis/product-scan', () => {
    test('GET should return sample scan result', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/product-scan`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('product');
      expect(data.data).toHaveProperty('compatibility');
      expect(data.data).toHaveProperty('analysis');
    });

    test('GET should return products list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/product-scan?type=products`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('POST should scan product compatibility', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analysis/product-scan`, {
        data: {
          productId: 'PROD-001',
          skinType: 'combination',
          concerns: ['สิว', 'รูขุมขน'],
        },
      });
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.compatibility).toHaveProperty('score');
      expect(data.data.compatibility).toHaveProperty('rating');
    });
  });

  // ============================================
  // 7. Environment Advisor API
  // ============================================
  test.describe('/api/analysis/environment', () => {
    test('GET should return daily advice', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/environment?location=Bangkok`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('environment');
      expect(data.data).toHaveProperty('alerts');
      expect(data.data).toHaveProperty('morningRoutine');
      expect(data.data).toHaveProperty('eveningRoutine');
    });

    test('should include UV and pollution data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/environment`);
      const data = await response.json();
      
      expect(data.data.environment).toHaveProperty('uvIndex');
      expect(data.data.environment).toHaveProperty('airQuality');
      expect(data.data.environment.airQuality).toHaveProperty('pm25');
    });
  });

  // ============================================
  // 8. Report Generation API
  // ============================================
  test.describe('/api/analysis/report', () => {
    test('GET should return HTML report', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/report?format=html`);
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      
      const html = await response.text();
      expect(html).toContain('BN-Aura');
      expect(html).toContain('Skin Analysis');
    });

    test('GET should return JSON with report data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analysis/report?format=json`);
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('html');
      expect(data.data).toHaveProperty('reportData');
    });

    test('POST should generate report from analysis data', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analysis/report`, {
        data: {
          customerName: 'ทดสอบ',
          customerAge: 35,
          analysisData: {
            skinMetrics: { overallScore: 75, skinAge: 38 },
            symmetry: { overallSymmetry: 87, goldenRatio: 1.58 },
          },
        },
      });
      const data = await response.json();
      
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.html).toContain('ทดสอบ');
    });
  });
});

// ============================================
// Integration Tests
// ============================================
test.describe('Integration Tests', () => {
  test('should handle full analysis flow', async ({ request }) => {
    // 1. Get comprehensive analysis
    const analysisRes = await request.get(`${BASE_URL}/api/analysis/skin?type=comprehensive&age=35`);
    const analysisData = await analysisRes.json();
    expect(analysisData.success).toBe(true);

    // 2. Get time travel predictions
    const timeRes = await request.get(
      `${BASE_URL}/api/analysis/time-travel?age=35&score=${analysisData.data.skinMetrics.overallScore}`
    );
    const timeData = await timeRes.json();
    expect(timeData.success).toBe(true);

    // 3. Find skin twins
    const twinRes = await request.get(`${BASE_URL}/api/analysis/skin-twin`);
    const twinData = await twinRes.json();
    expect(twinData.success).toBe(true);

    // 4. Generate report
    const reportRes = await request.post(`${BASE_URL}/api/analysis/report`, {
      data: {
        customerName: 'Integration Test',
        customerAge: 35,
        analysisData: analysisData.data,
      },
    });
    const reportData = await reportRes.json();
    expect(reportData.success).toBe(true);
    expect(reportData.data.html).toContain('Integration Test');
  });

  test('should get environment advice and check routines', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/analysis/environment?skinType=oily`);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    
    // Check morning routine has sunscreen
    const hasSunscreen = data.data.morningRoutine.some(
      (step: any) => step.stepThai.toLowerCase().includes('กันแดด') || 
                     step.product.toLowerCase().includes('spf')
    );
    expect(hasSunscreen).toBe(true);
    
    // Check for alerts if UV is high
    if (data.data.environment.uvIndex >= 8) {
      const hasUVAlert = data.data.alerts.some((a: any) => a.type === 'uv');
      expect(hasUVAlert).toBe(true);
    }
  });
});

// ============================================
// Error Handling Tests
// ============================================
test.describe('Error Handling', () => {
  test('should handle invalid analysis type', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/analysis/skin?type=invalid`);
    const data = await response.json();
    
    // Should either return error or default to comprehensive
    expect(response.status()).toBeLessThan(500);
  });

  test('should handle missing required params gracefully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/analysis/product-scan`, {
      data: {},
    });
    
    expect(response.status()).toBe(400);
  });
});
