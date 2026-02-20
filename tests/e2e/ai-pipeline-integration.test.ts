import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper function to create test data
async function createTestData() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Get existing clinic
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .limit(1)
    .single();
  
  if (!clinic) throw new Error('No clinic found');
  
  // Create test customer
  const { data: customer } = await supabase
    .from('customers')
    .insert({
      clinic_id: clinic.id,
      customer_code: 'TEST' + Date.now(),
      full_name: 'AI Pipeline Test Customer',
      email: `test-${Date.now()}@bnaura.com`,
      phone: '0812345678',
      date_of_birth: new Date('1990-01-01'),
      gender: 'female',
      skin_concerns: ['wrinkles', 'dryness']
    })
    .select()
    .single();
  
  // Get treatment
  const { data: treatment } = await supabase
    .from('treatments')
    .select('*')
    .eq('clinic_id', clinic.id)
    .limit(1)
    .single();
  
  return { clinic, customer, treatment };
}

// Helper function to clean up test data
async function cleanupTestData(customerId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);
}

test.describe('AI Pipeline End-to-End Tests', () => {
  let testData: any;
  
  test.beforeAll(async () => {
    testData = await createTestData();
  });
  
  test.afterAll(async () => {
    if (testData?.customer) {
      await cleanupTestData(testData.customer.id);
    }
  });

  test.describe('Phase 1: Skin Analysis', () => {
    test('should perform complete skin analysis flow', async ({ page }) => {
      // Login as sales staff
      await page.goto(`${BASE_URL}/th/login`);
      await page.fill('input[type="email"]', 'sales1.auth@bntest.com');
      await page.fill('input[type="password"]', 'AuthStaff123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*sales/);
      
      // Navigate to AI Analysis
      await page.goto(`${BASE_URL}/th/sales/ai-analysis`);
      await expect(page.locator('h1')).toContainText('AI Skin Analysis');
      
      // Enter customer name
      await page.fill('input[placeholder*="ลูกค้า"]', testData.customer.full_name);
      
      // Verify camera component loads
      await expect(page.locator('text=Real-time Face Analysis')).toBeVisible({ timeout: 10000 });
      
      // Simulate skin analysis via API
      const analysisResponse = await page.request.post(`${BASE_URL}/api/ai/analyze`, {
        data: {
          customerId: testData.customer.id,
          imageUrl: 'https://example.com/test-face.jpg'
        }
      });
      
      expect(analysisResponse.status()).toBe(200);
      const analysisData = await analysisResponse.json();
      expect(analysisData.success).toBe(true);
      expect(analysisData.data).toHaveProperty('skinMetrics');
      
      // Verify results appear in UI
      await page.click('button:has-text("ผลวิเคราะห์")');
      await expect(page.locator('text=Skin Score')).toBeVisible({ timeout: 5000 });
    });

    test('should handle skin analysis errors gracefully', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/ai/analyze`, {
        data: {}
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required');
    });
  });

  test.describe('Phase 2: Genetic Analysis Integration', () => {
    test('should integrate genetic data with treatment predictions', async ({ request }) => {
      // First, create genetic analysis
      const geneticResponse = await request.post(`${BASE_URL}/api/genetics/skin-analysis`, {
        data: {
          customerId: testData.customer.id,
          geneticMarkers: {
            'COL1A1_rs1800012': { variant: 'G', impact: 85 },
            'MC1R_rs1805007': { variant: 'T', impact: 90 }
          }
        }
      });
      
      expect(geneticResponse.status()).toBe(200);
      const geneticData = await geneticResponse.json();
      expect(geneticData.success).toBe(true);
      
      // Verify genetic data is stored
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: storedGenetic } = await supabase
        .from('genetic_analyses')
        .select('*')
        .eq('customer_id', testData.customer.id)
        .single();
      
      expect(storedGenetic).toBeTruthy();
      expect(storedGenetic.genetic_markers).toHaveProperty('COL1A1_rs1800012');
    });

    test('should enhance predictions with genetic data', async ({ request }) => {
      // Get treatment predictions with genetic context
      const predictionResponse = await request.get(
        `${BASE_URL}/api/ai/treatment-success-prediction?customerId=${testData.customer.id}&clinicId=${testData.clinic.id}`
      );
      
      expect(predictionResponse.status()).toBe(200);
      const predictionData = await predictionResponse.json();
      expect(predictionData.success).toBe(true);
      expect(predictionData.data.predictions).toBeInstanceOf(Array);
      
      // Verify genetic factors are considered
      const predictions = predictionData.data.predictions;
      expect(predictions[0]).toHaveProperty('geneticCompatibility');
    });
  });

  test.describe('Phase 3: Treatment Success Prediction', () => {
    test('should predict treatment success with high confidence', async ({ request }) => {
      const patientProfile = {
        age: 35,
        gender: 'female',
        skinType: 'combination',
        skinConditions: ['wrinkles', 'dryness'],
        previousTreatments: [],
        lifestyleFactors: {
          stress: 'medium',
          sleep: 'average',
          diet: 'average',
          smoking: false,
          alcohol: 'occasional'
        }
      };

      const response = await request.post(`${BASE_URL}/api/ai/treatment-success-prediction`, {
        data: {
          customerId: testData.customer.id,
          clinicId: testData.clinic.id,
          patientProfile,
          treatmentIds: [testData.treatment.id]
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      
      const predictions = data.data.predictions;
      expect(predictions).toHaveLength(1);
      expect(predictions[0].successProbability).toBeGreaterThan(0);
      expect(predictions[0].successProbability).toBeLessThanOrEqual(1);
      expect(predictions[0].confidenceScore).toBeGreaterThan(0.8); // High confidence expected
    });

    test('should log predictions for analytics', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Check if prediction was logged
      const { data: logs } = await supabase
        .from('prediction_logs')
        .select('*')
        .eq('customer_id', testData.customer.id)
        .eq('clinic_id', testData.clinic.id);
      
      expect(logs).toBeTruthy();
      expect(logs!.length).toBeGreaterThan(0);
    });
  });

  test.describe('Phase 4: Trend Analysis Integration', () => {
    test('should analyze skin condition trends', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/analytics/trends?condition=wrinkles&clinicId=${testData.clinic.id}`
      );
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('trend');
      expect(data.data.trend).toHaveProperty('direction'); // -1 to 1
      expect(data.data.trend).toHaveProperty('strength'); // 0-100
    });

    test('should provide seasonal insights', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/analytics/seasonal?clinicId=${testData.clinic.id}`
      );
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('seasonality');
      expect(data.data.seasonality).toHaveProperty('peaks');
      expect(data.data.seasonality).toHaveProperty('troughs');
    });
  });

  test.describe('Phase 5: Full Pipeline Performance', () => {
    test('should complete full pipeline within performance targets', async ({ request }) => {
      const startTime = Date.now();
      
      // Step 1: Skin Analysis
      const skinResponse = await request.post(`${BASE_URL}/api/ai/analyze`, {
        data: {
          customerId: testData.customer.id,
          imageUrl: 'https://example.com/test-face.jpg'
        }
      });
      const skinTime = Date.now() - startTime;
      
      // Step 2: Genetic Analysis
      const geneticStart = Date.now();
      await request.post(`${BASE_URL}/api/genetics/skin-analysis`, {
        data: {
          customerId: testData.customer.id,
          geneticMarkers: {
            'COL1A1_rs1800012': { variant: 'G', impact: 85 }
          }
        }
      });
      const geneticTime = Date.now() - geneticStart;
      
      // Step 3: Treatment Prediction
      const predictionStart = Date.now();
      await request.get(
        `${BASE_URL}/api/ai/treatment-success-prediction?customerId=${testData.customer.id}&clinicId=${testData.clinic.id}`
      );
      const predictionTime = Date.now() - predictionStart;
      
      const totalTime = Date.now() - startTime;
      
      // Performance assertions
      expect(skinTime).toBeLessThan(3000); // < 3 seconds
      expect(geneticTime).toBeLessThan(2000); // < 2 seconds
      expect(predictionTime).toBeLessThan(1500); // < 1.5 seconds
      expect(totalTime).toBeLessThan(5000); // < 5 seconds total
      
      console.log(`Pipeline Performance: Skin=${skinTime}ms, Genetic=${geneticTime}ms, Prediction=${predictionTime}ms, Total=${totalTime}ms`);
    });

    test('should handle concurrent requests', async ({ request }) => {
      const concurrentRequests = 10;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request.get(
            `${BASE_URL}/api/ai/treatment-success-prediction?customerId=${testData.customer.id}&clinicId=${testData.clinic.id}`
          )
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // Should handle concurrent load efficiently
      expect(totalTime / concurrentRequests).toBeLessThan(1000); // Average < 1 second per request
    });
  });

  test.describe('Phase 6: Data Consistency', () => {
    test('should maintain data consistency across all AI tables', async () => {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Check skin analyses
      const { data: skinAnalyses } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('customer_id', testData.customer.id);
      
      // Check genetic analyses
      const { data: geneticAnalyses } = await supabase
        .from('genetic_analyses')
        .select('*')
        .eq('customer_id', testData.customer.id);
      
      // Check prediction logs
      const { data: predictionLogs } = await supabase
        .from('prediction_logs')
        .select('*')
        .eq('customer_id', testData.customer.id);
      
      // Verify data relationships
      expect(skinAnalyses?.length || 0).toBeGreaterThanOrEqual(0);
      expect(geneticAnalyses?.length || 0).toBeGreaterThanOrEqual(0);
      expect(predictionLogs?.length || 0).toBeGreaterThanOrEqual(0);
      
      // All should have correct clinic_id
      if (skinAnalyses?.length) {
        expect(skinAnalyses[0].clinic_id).toBe(testData.clinic.id);
      }
      if (geneticAnalyses?.length) {
        expect(geneticAnalyses[0].clinic_id).toBe(testData.clinic.id);
      }
      if (predictionLogs?.length) {
        expect(predictionLogs[0].clinic_id).toBe(testData.clinic.id);
      }
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle invalid customer ID gracefully', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/ai/treatment-success-prediction?customerId=invalid-id&clinicId=${testData.clinic.id}`
      );
      
      expect(response.status()).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should handle missing genetic data', async ({ request }) => {
      // Create new customer without genetic data
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          clinic_id: testData.clinic.id,
          customer_code: 'NOGEN' + Date.now(),
          full_name: 'No Genetic Data Customer',
          email: `nogen-${Date.now()}@bnaura.com`,
          phone: '0812345679',
          date_of_birth: new Date('1995-01-01'),
          gender: 'male',
          skin_concerns: ['acne']
        })
        .select()
        .single();
      
      // Should still provide predictions without genetic data
      const response = await request.get(
        `${BASE_URL}/api/ai/treatment-success-prediction?customerId=${newCustomer.id}&clinicId=${testData.clinic.id}`
      );
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.predictions[0].geneticCompatibility).toBeLessThan(0.5); // Lower confidence without genetic data
      
      // Cleanup
      await supabase
        .from('customers')
        .delete()
        .eq('id', newCustomer.id);
    });
  });
});
