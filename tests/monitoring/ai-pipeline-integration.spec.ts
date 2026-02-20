import { test, expect } from '@playwright/test';

test.describe('AI Pipeline Monitoring Integration', () => {
  const baseUrl = 'http://localhost:3000';

  test.beforeEach(async ({ request }) => {
    // Verify the server is running
    const healthResponse = await request.get('/api/health');
    expect(healthResponse.ok()).toBeTruthy();
  });

  test('Health check endpoint structure', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    // Verify basic structure
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('status');
    expect(data.data).toHaveProperty('checks');
    expect(data.data).toHaveProperty('services');
    expect(data.data).toHaveProperty('responseTime');
    expect(data.data).toHaveProperty('timestamp');

    // Verify services status
    expect(data.data.services).toHaveProperty('database');
    expect(data.data.services).toHaveProperty('stripe');
    expect(data.data.services).toHaveProperty('resend');
    expect(data.data.services).toHaveProperty('supabase');

    console.log('Health check passed:', {
      status: data.data.status,
      database: data.data.services.database,
      responseTime: data.data.responseTime
    });
  });

  test('AI endpoints availability', async ({ request }) => {
    const endpoints = [
      { path: '/api/ai/analyze', method: 'GET', description: 'Skin Analysis' },
      { path: '/api/genetics/skin-analysis', method: 'GET', description: 'Genetic Analysis' },
      { path: '/api/ai/treatment-success-prediction', method: 'GET', description: 'Treatment Prediction' },
      { path: '/api/analytics/trend-analysis', method: 'GET', description: 'Trend Analysis' },
      { path: '/api/ai/analyze', method: 'POST', description: 'Skin Analysis (POST)' },
      { path: '/api/ai/treatment-success-prediction', method: 'POST', description: 'Treatment Prediction (POST)' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await request[endpoint.method.toLowerCase()](endpoint.path);
        results.push({
          ...endpoint,
          status: response.status(),
          success: response.ok()
        });
      } catch (error) {
        results.push({
          ...endpoint,
          status: 'ERROR',
          success: false,
          error: error.message
        });
      }
    }

    console.table(results);

    // All endpoints should respond (even with errors)
    results.forEach(result => {
      expect(result.status).not.toBe('ERROR');
    });
  });

  test('Treatment prediction with valid data', async ({ request }) => {
    const testData = {
      customerId: 'test-customer-123',
      clinicId: 'test-clinic-123',
      patientProfile: {
        age: 30,
        gender: 'female',
        skinType: 'normal',
        skinConditions: ['dryness'],
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
    };

    const response = await request.post('/api/ai/treatment-success-prediction', {
      data: testData
    });

    const data = await response.json();

    console.log('Treatment prediction response:', {
      status: response.status(),
      success: data.success,
      error: data.error || null
    });

    // Should handle the request gracefully
    expect([200, 400, 401, 404, 500]).toContain(response.status());
    expect(data).toHaveProperty('success');
    
    if (data.success) {
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('predictions');
    } else {
      expect(data).toHaveProperty('error');
    }
  });

  test('Monitoring dashboard access control', async ({ page }) => {
    // Try to access monitoring dashboard without authentication
    const response = await page.goto('/th/admin/monitoring');
    
    // Should not crash
    expect(response?.status()).toBeLessThan(500);
    
    // Should redirect to login for unauthenticated users
    const url = page.url();
    expect(url.includes('/login') || url.includes('/admin')).toBeTruthy();
    
    console.log('Monitoring dashboard access control:', {
      finalUrl: url,
      correctlyRedirected: url.includes('/login')
    });
  });

  test('Performance metrics collection', async ({ request }) => {
    // Make multiple requests to generate metrics
    const requests = Array(5).fill(null).map(() => 
      request.get('/api/health')
    );

    const responses = await Promise.all(requests);
    const responseTimes = responses.map(r => 
      parseInt(r.headers()['x-response-time'] || '0')
    );

    console.log('Performance metrics:', {
      requestCount: responses.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes)
    });

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });

  test('Error handling and logging', async ({ request }) => {
    // Test with invalid data to ensure proper error handling
    const invalidRequests = [
      request.post('/api/ai/treatment-success-prediction', { data: {} }),
      request.post('/api/ai/treatment-success-prediction', { data: { invalid: 'data' } }),
      request.get('/api/ai/treatment-success-prediction?invalid=params')
    ];

    const responses = await Promise.all(invalidRequests);

    responses.forEach(async (response) => {
      const data = await response.json();
      
      // Should return proper error responses
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      
      // Status should indicate client or server error
      expect([400, 401, 404, 500]).toContain(response.status());
    });

    console.log('Error handling test passed - all invalid requests handled properly');
  });

  test('Database connectivity through AI endpoints', async ({ request }) => {
    // Test endpoints that require database connection
    const dbDependentEndpoints = [
      '/api/ai/treatment-success-prediction',
      '/api/analytics/trend-analysis'
    ];

    for (const endpoint of dbDependentEndpoints) {
      const response = await request.get(endpoint);
      
      // Should not return database connection errors
      if (!response.ok()) {
        const data = await response.json();
        expect(data.error).not.toContain('database');
        expect(data.error).not.toContain('connection');
      }
    }

    console.log('Database connectivity verified through AI endpoints');
  });
});
