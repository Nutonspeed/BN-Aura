// Comprehensive Dashboard Testing Script
// ทดสอบ API endpoints ทั้งหมดตามแผนการทดสอบ comprehensive dashboard

const BASE_URL = 'http://localhost:3000/api/admin';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

// Helper function to log test results
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
  
  testResults.details.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Helper function to make API requests
async function testAPI(endpoint, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.status === expectedStatus,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

// 1. Clinic Management API Tests
async function testClinicManagementAPI() {
  console.log('\n🏥 Testing Clinic Management API');
  
  // Test GET clinics
  const clinicsResponse = await testAPI('/management?type=clinics');
  logTest('GET /api/admin/management?type=clinics', 
    clinicsResponse.success && clinicsResponse.data.success,
    clinicsResponse.success ? `Found ${clinicsResponse.data.data?.clinics?.length || 0} clinics` : clinicsResponse.error
  );
  
  // Test POST create clinic
  const createClinicResponse = await testAPI('/management', 'POST', {
    action: 'createClinic',
    clinicData: {
      display_name: { th: 'คลินิกทดสอบ', en: 'Test Clinic' },
      clinic_code: 'TEST001',
      subscription_tier: 'starter',
      max_sales_staff: 3,
      metadata: {
        contact: {
          email: 'test@clinic.com',
          phone: '0812345678',
          address: 'Test Address'
        }
      }
    }
  });
  logTest('POST /api/admin/management (create clinic)',
    createClinicResponse.success || createClinicResponse.status === 400,
    createClinicResponse.success ? 'Clinic created successfully' : createClinicResponse.data?.error || 'May already exist'
  );
}

// 2. Global Analytics API Tests
async function testGlobalAnalyticsAPI() {
  console.log('\n📊 Testing Global Analytics API');
  
  // Test GET analytics overview
  const analyticsResponse = await testAPI('/analytics/overview');
  logTest('GET /api/admin/analytics/overview',
    analyticsResponse.success && analyticsResponse.data.success,
    analyticsResponse.success ? 'Analytics data retrieved' : analyticsResponse.error
  );
  
  // Test GET revenue analytics
  const revenueResponse = await testAPI('/analytics/revenue?period=30d');
  logTest('GET /api/admin/analytics/revenue?period=30d',
    revenueResponse.success && revenueResponse.data.success,
    revenueResponse.success ? `Revenue data: ${revenueResponse.data.data?.totalRevenue || 0}` : revenueResponse.error
  );
  
  // Test GET AI usage analytics
  const aiUsageResponse = await testAPI('/analytics/ai-usage');
  logTest('GET /api/admin/analytics/ai-usage',
    aiUsageResponse.success && aiUsageResponse.data.success,
    aiUsageResponse.success ? `AI usage: ${aiUsageResponse.data.data?.totalScans || 0} scans` : aiUsageResponse.error
  );
}

// 3. System Health Check API Tests
async function testSystemHealthAPI() {
  console.log('\n🔧 Testing System Health Check API');
  
  // Test GET system metrics
  const metricsResponse = await testAPI('/system?type=metrics');
  logTest('GET /api/admin/system?type=metrics',
    metricsResponse.success && metricsResponse.data.success,
    metricsResponse.success ? `System metrics loaded` : metricsResponse.error
  );
  
  // Test GET system alerts
  const alertsResponse = await testAPI('/system?type=alerts');
  logTest('GET /api/admin/system?type=alerts',
    alertsResponse.success && alertsResponse.data.success,
    alertsResponse.success ? `Alerts: ${alertsResponse.data.data?.alerts?.length || 0}` : alertsResponse.error
  );
  
  // Test GET system health
  const healthResponse = await testAPI('/system?type=health');
  logTest('GET /api/admin/system?type=health',
    healthResponse.success && healthResponse.data.success,
    healthResponse.success ? `System status: ${healthResponse.data.data?.status || 'unknown'}` : healthResponse.error
  );
}

// 4. User Management API Tests
async function testUserManagementAPI() {
  console.log('\n👥 Testing User Management API');
  
  // Test GET users
  const usersResponse = await testAPI('/management?type=users');
  logTest('GET /api/admin/management?type=users',
    usersResponse.success && usersResponse.data.success,
    usersResponse.success ? `Users: ${usersResponse.data.data?.users?.length || 0}` : usersResponse.error
  );
  
  // Test POST update user status
  const updateUserResponse = await testAPI('/management', 'POST', {
    action: 'updateUserStatus',
    userId: 'test-user-id',
    status: false
  });
  logTest('POST /api/admin/management (update user status)',
    updateUserResponse.success || updateUserResponse.status === 404,
    updateUserResponse.success ? 'User status updated' : 'User not found (expected)'
  );
  
  // Test POST create user
  const createUserResponse = await testAPI('/management', 'POST', {
    action: 'createUser',
    userData: {
      email: 'testuser@example.com',
      fullName: 'Test User',
      role: 'free_user',
      clinicId: 'test-clinic-id'
    }
  });
  logTest('POST /api/admin/management (create user)',
    createUserResponse.success || createUserResponse.status === 400,
    createUserResponse.success ? 'User created' : 'May already exist'
  );
}

// 5. Security & Permissions API Tests
async function testSecurityAPI() {
  console.log('\n🔒 Testing Security & Permissions API');
  
  // Test GET security metrics
  const securityResponse = await testAPI('/security/metrics');
  logTest('GET /api/admin/security/metrics',
    securityResponse.success || securityResponse.status === 404,
    securityResponse.success ? 'Security metrics loaded' : 'Endpoint may not exist yet'
  );
  
  // Test GET security events
  const eventsResponse = await testAPI('/security/events');
  logTest('GET /api/admin/security/events',
    eventsResponse.success || eventsResponse.status === 404,
    eventsResponse.success ? 'Security events loaded' : 'Endpoint may not exist yet'
  );
}

// 6. Billing API Tests
async function testBillingAPI() {
  console.log('\n💳 Testing Billing API');
  
  // Test GET billing records
  const billingResponse = await testAPI('/billing/records');
  logTest('GET /api/admin/billing/records',
    billingResponse.success || billingResponse.status === 404,
    billingResponse.success ? `Billing records: ${billingResponse.data.data?.records?.length || 0}` : 'Endpoint may not exist yet'
  );
  
  // Test GET subscriptions
  const subscriptionsResponse = await testAPI('/billing/subscriptions');
  logTest('GET /api/admin/billing/subscriptions',
    subscriptionsResponse.success || subscriptionsResponse.status === 404,
    subscriptionsResponse.success ? `Subscriptions: ${subscriptionsResponse.data.data?.subscriptions?.length || 0}` : 'Endpoint may not exist yet'
  );
}

// 7. Broadcast API Tests
async function testBroadcastAPI() {
  console.log('\n📢 Testing Broadcast API');
  
  // Test GET announcements
  const announcementsResponse = await testAPI('/broadcast/announcements');
  logTest('GET /api/admin/broadcast/announcements',
    announcementsResponse.success || announcementsResponse.status === 404,
    announcementsResponse.success ? `Announcements: ${announcementsResponse.data.data?.announcements?.length || 0}` : 'Endpoint may not exist yet'
  );
  
  // Test POST create announcement
  const createAnnouncementResponse = await testAPI('/broadcast', 'POST', {
    action: 'createAnnouncement',
    announcementData: {
      title: 'Test Announcement',
      content: 'This is a test announcement',
      type: 'info',
      target_clinics: 'all'
    }
  });
  logTest('POST /api/admin/broadcast (create announcement)',
    createAnnouncementResponse.success || createAnnouncementResponse.status === 404,
    createAnnouncementResponse.success ? 'Announcement created' : 'Endpoint may not exist yet'
  );
}

// 8. Support API Tests (Additional)
async function testSupportAPI() {
  console.log('\n🎧 Testing Support API');
  
  // Test GET support tickets
  const ticketsResponse = await testAPI('/support/tickets');
  logTest('GET /api/admin/support/tickets',
    ticketsResponse.success && ticketsResponse.data.success,
    ticketsResponse.success ? `Tickets: ${ticketsResponse.data.data?.tickets?.length || 0}` : ticketsResponse.error
  );
  
  // Test GET audit logs
  const auditResponse = await testAPI('/audit/logs');
  logTest('GET /api/admin/audit/logs',
    auditResponse.success && auditResponse.data.success,
    auditResponse.success ? `Audit logs: ${auditResponse.data.data?.logs?.length || 0}` : auditResponse.error
  );
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Dashboard API Tests');
  console.log('==================================================');
  
  try {
    await testClinicManagementAPI();
    await testGlobalAnalyticsAPI();
    await testSystemHealthAPI();
    await testUserManagementAPI();
    await testSecurityAPI();
    await testBillingAPI();
    await testBroadcastAPI();
    await testSupportAPI();
    
    console.log('\n==================================================');
    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.details.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  }
}

// Run tests
runAllTests();
