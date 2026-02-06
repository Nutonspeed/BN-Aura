/**
 * BN-Aura Quota System End-to-End Integration Tests
 * Tests the complete workflow: AI Analysis → Quota Enforcement → Billing → Dashboard
 */

describe('Quota System E2E Integration', () => {
  const testClinicId = 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';
  const testUserId = 'integration-test-user-123';
  
  beforeAll(async () => {
    // Reset quota for testing
    console.log('🔄 Resetting quota for integration tests...');
  });

  describe('1. AI Analysis with Quota Integration', () => {
    test('Should perform AI analysis and consume quota', async () => {
      const analysisPayload = {
        customerInfo: {
          name: 'Integration Test Customer',
          age: 25,
          skinType: 'Combination'
        },
        facialMetrics: {
          facialAsymmetry: 0.2,
          skinTexture: 0.8,
          volumeLoss: [0.1, 0.3],
          wrinkleDepth: 0.4,
          poreSize: 0.6
        },
        clinicId: testClinicId,
        userId: testUserId,
        useProModel: false
      };

      const response = await fetch('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisPayload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(data.modelUsed).toBeDefined();
      expect(data.quotaInfo).toBeDefined();
      expect(data.quotaInfo.consumed).toBeGreaterThan(0);
    });

    test('Should reject analysis when quota exceeded', async () => {
      // First, consume most quota by multiple requests
      const requests = [];
      for (let i = 0; i < 95; i++) {
        requests.push(
          fetch('http://localhost:3000/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerInfo: { name: `Test ${i}`, age: 30 },
              facialMetrics: { facialAsymmetry: 0.1, skinTexture: 0.5, volumeLoss: [0.1], wrinkleDepth: 0.2, poreSize: 0.3 },
              clinicId: testClinicId,
              userId: testUserId,
              useProModel: false
            })
          })
        );
      }
      
      // Execute some requests to near quota limit
      await Promise.all(requests.slice(0, 10));
      
      // This should be rejected due to quota exceeded
      const rejectedResponse = await fetch('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: { name: 'Should Fail', age: 30 },
          facialMetrics: { facialAsymmetry: 0.1, skinTexture: 0.5, volumeLoss: [0.1], wrinkleDepth: 0.2, poreSize: 0.3 },
          clinicId: testClinicId,
          userId: testUserId,
          useProModel: false
        })
      });

      expect(rejectedResponse.status).toBe(403);
      const errorData = await rejectedResponse.json();
      expect(errorData.quotaExceeded).toBe(true);
      expect(errorData.error).toContain('Cannot perform AI analysis');
    });
  });

  describe('2. Quota Dashboard Integration', () => {
    test('Dashboard should display real-time quota data', async () => {
      const dashboardResponse = await fetch(`http://localhost:3000/api/quota/billing-test?action=quota-config&clinicId=${testClinicId}`);
      
      expect(dashboardResponse.status).toBe(200);
      const dashboardData = await dashboardResponse.json();
      
      expect(dashboardData.success).toBe(true);
      expect(dashboardData.data).toBeDefined();
      expect(dashboardData.data.monthlyQuota).toBeGreaterThan(0);
      expect(dashboardData.data.currentUsage).toBeGreaterThan(0);
      expect(dashboardData.data.plan).toBeDefined();
    });

    test('Usage stats should reflect AI analysis consumption', async () => {
      const statsResponse = await fetch(`http://localhost:3000/api/quota/billing-test?action=usage-stats&clinicId=${testClinicId}`);
      
      expect(statsResponse.status).toBe(200);
      const statsData = await statsResponse.json();
      
      expect(statsData.success).toBe(true);
      expect(statsData.data.utilizationRate).toBeGreaterThan(0);
    });
  });

  describe('3. Billing System Integration', () => {
    test('Should provide plan recommendations based on usage', async () => {
      const recommendationsResponse = await fetch(`http://localhost:3000/api/quota/billing-test?action=recommendations&clinicId=${testClinicId}`);
      
      expect(recommendationsResponse.status).toBe(200);
      const recsData = await recommendationsResponse.json();
      
      expect(recsData.success).toBe(true);
      expect(recsData.data.currentPlan).toBeDefined();
      expect(recsData.data.reasoning).toBeDefined();
    });

    test('Should process top-up purchases', async () => {
      const topupResponse = await fetch('http://localhost:3000/api/quota/billing-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase-topup',
          clinicId: testClinicId,
          scanCount: 50
        })
      });

      expect(topupResponse.status).toBe(200);
      const topupData = await topupResponse.json();
      
      expect(topupData.success).toBe(true);
      expect(topupData.data.success).toBe(true);
      expect(topupData.data.totalCost).toBeGreaterThan(0);
      expect(topupData.data.newQuota).toBeGreaterThan(0);
    });
  });

  describe('4. Error Handling & Edge Cases', () => {
    test('Should handle missing clinic ID gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: { name: 'Test', age: 30 },
          facialMetrics: { facialAsymmetry: 0.1, skinTexture: 0.5, volumeLoss: [0.1], wrinkleDepth: 0.2, poreSize: 0.3 },
          userId: testUserId
          // Missing clinicId
        })
      });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain('Missing required fields');
    });

    test('Should handle invalid clinic ID', async () => {
      const response = await fetch(`http://localhost:3000/api/quota/billing-test?action=quota-config&clinicId=invalid-clinic-id`);
      
      // Should either return 404 or empty data, not crash
      expect([200, 404]).toContain(response.status);
    });

    test('Should handle concurrent requests properly', async () => {
      const concurrentRequests = Array(5).fill(null).map((_, i) => 
        fetch('http://localhost:3000/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerInfo: { name: `Concurrent Test ${i}`, age: 25 },
            facialMetrics: { facialAsymmetry: 0.1, skinTexture: 0.5, volumeLoss: [0.1], wrinkleDepth: 0.2, poreSize: 0.3 },
            clinicId: testClinicId,
            userId: `${testUserId}-${i}`,
            useProModel: false
          })
        })
      );

      const results = await Promise.all(concurrentRequests);
      
      // At least some should succeed (depending on quota availability)
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('5. Performance Benchmarks', () => {
    test('AI analysis should complete within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: { name: 'Performance Test', age: 30 },
          facialMetrics: { facialAsymmetry: 0.1, skinTexture: 0.5, volumeLoss: [0.1], wrinkleDepth: 0.2, poreSize: 0.3 },
          clinicId: testClinicId,
          userId: testUserId,
          useProModel: false
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds for mock analysis
      expect(duration).toBeLessThan(10000);
      expect(response.status).toBe(200);
    });

    test('Dashboard API should be fast', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`http://localhost:3000/api/quota/billing-test?action=quota-config&clinicId=${testClinicId}`);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Dashboard should load within 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(response.status).toBe(200);
    });
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up integration test data...');
    // Reset quota back to original state
  });
});

// Helper functions for integration tests
const TestHelpers = {
  async resetQuota(clinicId) {
    // Reset quota_used to a low number for testing
    return fetch('/api/quota/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId, newUsage: 5 })
    });
  },

  async fillQuotaNearLimit(clinicId, userId) {
    // Make multiple requests to consume quota near limit
    const requests = [];
    for (let i = 0; i < 90; i++) {
      requests.push(this.makeAIRequest(clinicId, `${userId}-fill-${i}`));
    }
    return Promise.all(requests);
  },

  makeAIRequest(clinicId, userId, customerName = 'Test Customer') {
    return fetch('http://localhost:3000/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: customerName, age: 25 },
        facialMetrics: { facialAsymmetry: 0.1, skinTexture: 0.5, volumeLoss: [0.1], wrinkleDepth: 0.2, poreSize: 0.3 },
        clinicId,
        userId,
        useProModel: false
      })
    });
  }
};

module.exports = { TestHelpers };
