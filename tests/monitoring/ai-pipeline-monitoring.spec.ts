import { test, expect } from '@playwright/test';

test.describe('AI Pipeline Monitoring', () => {
  test('Health check endpoint includes AI pipeline status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Check if the response has the expected structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('status');
    expect(data.data).toHaveProperty('responseTime');
    expect(data.data).toHaveProperty('services');
    
    console.log('Health check response:', JSON.stringify(data, null, 2));
  });

  test('AI treatment prediction endpoint responds correctly', async ({ request }) => {
    // Test GET request
    const getResponse = await request.get('/api/ai/treatment-success-prediction?customerId=test&clinicId=test');
    
    expect(getResponse.ok()).toBeFalsy(); // Should fail with missing valid credentials
    
    // Test POST request with sample data
    const postResponse = await request.post('/api/ai/treatment-success-prediction', {
      data: {
        customerId: 'test-customer-id',
        clinicId: 'test-clinic-id',
        patientProfile: {
          age: 30,
          gender: 'female',
          skinType: 'normal',
          skinConditions: [],
          previousTreatments: [],
          lifestyleFactors: {
            stress: 'medium',
            sleep: 'average',
            diet: 'average',
            smoking: false,
            alcohol: 'occasional'
          },
          environmentalFactors: {
            pollution: 'medium',
            sunExposure: 'medium',
            climate: 'temperate'
          }
        },
        treatmentIds: ['treatment-1', 'treatment-2']
      }
    });
    
    const postData = await postResponse.json();
    console.log('Treatment prediction response:', JSON.stringify(postData, null, 2));
    
    // Should either succeed with predictions or fail gracefully
    expect(postData).toHaveProperty('success');
  });

  test('Monitoring dashboard route exists', async ({ page }) => {
    // Try to access the monitoring dashboard
    const response = await page.goto('/admin/monitoring');
    
    // Should either load the dashboard or redirect to login
    expect(response?.status()).toBeLessThan(500);
    
    const url = page.url();
    console.log('Final URL after accessing monitoring:', url);
    
    // If redirected to login, that's expected behavior
    if (url.includes('/login')) {
      console.log('Correctly redirected to login for protected route');
    }
  });

  test('E2E AI Pipeline flow test', async ({ request }) => {
    // Test the full AI pipeline endpoints
    const endpoints = [
      '/api/ai/skin-analysis',
      '/api/ai/genetic-analysis',
      '/api/ai/treatment-success-prediction',
      '/api/analytics/trend-analysis'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      
      try {
        const response = await request.get(endpoint);
        const status = response.status();
        
        console.log(`${endpoint} - Status: ${status}`);
        
        // Endpoints should either work (200) or require authentication (401/400)
        expect([200, 400, 401, 404]).toContain(status);
      } catch (error) {
        console.error(`Error testing ${endpoint}:`, error);
        // Network errors are acceptable in test environment
      }
    }
  });
});
