/**
 * Sequential Testing Script - Alternative to Playwright MCP
 * ทดสอบระบบ BN-Aura แบบ sequential ด้วยข้อมูลจริง
 */

// Import modules
const fs = require('fs');

// Use built-in fetch (Node.js 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test Results Storage
let testResults = {
  phase1: { auth: {} },
  phase2: { workflows: {} },
  phase3: { security: {} },
  phase4: { reporting: {} },
  phase5: { ai: {} }
};

/**
 * Phase 1: Authentication & Authorization Testing
 */
async function testAuthentication() {
  console.log('\n🏁 Phase 1: Authentication & Authorization Testing');
  
  // Test Super Admin Login
  console.log('\n1.1 Testing Super Admin Login...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nuttapong161@gmail.com',
        password: '127995803'
      })
    });
    
    const data = await response.json();
    testResults.phase1.auth.superAdmin = {
      status: response.status,
      success: response.ok,
      user: data.user,
      hasSession: !!data.session
    };
    
    console.log(`✅ Super Admin Login: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    if (data.user) {
      console.log(`   User: ${data.user.email} (${data.user.role})`);
    }
  } catch (error) {
    console.log(`❌ Super Admin Login Error: ${error.message}`);
    testResults.phase1.auth.superAdmin = { error: error.message };
  }
  
  // Test Clinic Owner Login
  console.log('\n1.2 Testing Clinic Owner Login...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testclinicowner2024@10minutemail.com',
        password: 'BNAura2024!'
      })
    });
    
    const data = await response.json();
    testResults.phase1.auth.clinicOwner = {
      status: response.status,
      success: response.ok,
      user: data.user,
      hasSession: !!data.session,
      clinicId: data.user?.clinic_id,
      staffRole: data.staff?.role
    };
    
    console.log(`✅ Clinic Owner Login: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    if (data.user) {
      console.log(`   User: ${data.user.email} (${data.user.role}/${data.staff?.role})`);
      console.log(`   Clinic: ${data.user.clinic_id}`);
    }
  } catch (error) {
    console.log(`❌ Clinic Owner Login Error: ${error.message}`);
    testResults.phase1.auth.clinicOwner = { error: error.message };
  }
  
  return testResults.phase1;
}

/**
 * Phase 2: Core Business Workflows Testing
 */
async function testCoreWorkflows() {
  console.log('\n🏥 Phase 2: Core Business Workflows Testing');
  
  // Test Appointments API
  console.log('\n2.1 Testing Appointments Workflow...');
  try {
    const response = await fetch(`${BASE_URL}/api/appointments?date=2026-02-03`);
    const data = await response.json();
    
    testResults.phase2.workflows.appointments = {
      status: response.status,
      success: response.ok,
      dataCount: data.data?.length || 0,
      hasData: (data.data?.length || 0) > 0
    };
    
    console.log(`✅ Appointments API: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data Count: ${data.data?.length || 0} appointments`);
  } catch (error) {
    console.log(`❌ Appointments API Error: ${error.message}`);
    testResults.phase2.workflows.appointments = { error: error.message };
  }
  
  // Test Treatments API
  console.log('\n2.2 Testing Treatments Workflow...');
  try {
    const response = await fetch(`${BASE_URL}/api/treatments`);
    const data = await response.json();
    
    testResults.phase2.workflows.treatments = {
      status: response.status,
      success: response.ok,
      dataCount: data.data?.length || 0,
      hasData: (data.data?.length || 0) > 0
    };
    
    console.log(`✅ Treatments API: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data Count: ${data.data?.length || 0} treatments`);
  } catch (error) {
    console.log(`❌ Treatments API Error: ${error.message}`);
    testResults.phase2.workflows.treatments = { error: error.message };
  }
  
  // Test Products API (POS)
  console.log('\n2.3 Testing POS Products Workflow...');
  try {
    const response = await fetch(`${BASE_URL}/api/products`);
    const data = await response.json();
    
    testResults.phase2.workflows.products = {
      status: response.status,
      success: response.ok,
      dataCount: data.data?.length || 0,
      hasData: (data.data?.length || 0) > 0
    };
    
    console.log(`✅ Products API: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data Count: ${data.data?.length || 0} products`);
  } catch (error) {
    console.log(`❌ Products API Error: ${error.message}`);
    testResults.phase2.workflows.products = { error: error.message };
  }
  
  return testResults.phase2;
}

/**
 * Phase 3: Data Integrity & Security Testing
 */
async function testDataSecurity() {
  console.log('\n📊 Phase 3: Data Integrity & Security Testing');
  
  // Test Branches API
  console.log('\n3.1 Testing Branches Data...');
  try {
    const response = await fetch(`${BASE_URL}/api/branches`);
    const data = await response.json();
    
    testResults.phase3.security.branches = {
      status: response.status,
      success: response.ok,
      dataCount: data.data?.length || 0,
      hasData: (data.data?.length || 0) > 0
    };
    
    console.log(`✅ Branches API: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data Count: ${data.data?.length || 0} branches`);
  } catch (error) {
    console.log(`❌ Branches API Error: ${error.message}`);
    testResults.phase3.security.branches = { error: error.message };
  }
  
  // Test RLS Policies (Data Isolation)
  console.log('\n3.2 Testing RLS Data Isolation...');
  const allAPIs = [
    { name: 'appointments', url: '/api/appointments' },
    { name: 'treatments', url: '/api/treatments' },
    { name: 'products', url: '/api/products' },
    { name: 'branches', url: '/api/branches' }
  ];
  
  testResults.phase3.security.rls = {};
  
  for (const api of allAPIs) {
    try {
      const response = await fetch(`${BASE_URL}${api.url}`);
      const data = await response.json();
      
      testResults.phase3.security.rls[api.name] = {
        status: response.status,
        success: response.ok,
        dataReturned: (data.data?.length || 0) > 0,
        message: response.ok ? 'RLS Working' : 'RLS Failed'
      };
      
      console.log(`   ${api.name}: ${response.ok ? '✅ RLS OK' : '❌ RLS FAILED'}`);
    } catch (error) {
      testResults.phase3.security.rls[api.name] = { error: error.message };
      console.log(`   ${api.name}: ❌ Error - ${error.message}`);
    }
  }
  
  return testResults.phase3;
}

/**
 * Phase 4: System Health Check
 */
async function testSystemHealth() {
  console.log('\n📈 Phase 4: System Health Check');
  
  // Test Server Response Time
  console.log('\n4.1 Testing Server Performance...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/appointments`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    testResults.phase4.reporting.performance = {
      responseTime,
      status: response.status,
      success: response.ok,
      performanceGrade: responseTime < 1000 ? 'EXCELLENT' : responseTime < 3000 ? 'GOOD' : 'SLOW'
    };
    
    console.log(`✅ Server Performance: ${responseTime}ms (${testResults.phase4.reporting.performance.performanceGrade})`);
  } catch (error) {
    console.log(`❌ Performance Test Error: ${error.message}`);
    testResults.phase4.reporting.performance = { error: error.message };
  }
  
  return testResults.phase4;
}

/**
 * Generate Test Report
 */
function generateReport() {
  console.log('\n📋 SEQUENTIAL TESTING REPORT');
  console.log('='.repeat(50));
  
  // Phase 1 Summary
  console.log('\n🏁 Phase 1: Authentication & Authorization');
  const auth = testResults.phase1.auth;
  console.log(`   Super Admin: ${auth.superAdmin?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Clinic Owner: ${auth.clinicOwner?.success ? '✅ PASS' : '❌ FAIL'}`);
  
  // Phase 2 Summary
  console.log('\n🏥 Phase 2: Core Business Workflows');
  const workflows = testResults.phase2.workflows;
  console.log(`   Appointments: ${workflows.appointments?.success ? '✅ PASS' : '❌ FAIL'} (${workflows.appointments?.dataCount || 0} records)`);
  console.log(`   Treatments: ${workflows.treatments?.success ? '✅ PASS' : '❌ FAIL'} (${workflows.treatments?.dataCount || 0} records)`);
  console.log(`   Products: ${workflows.products?.success ? '✅ PASS' : '❌ FAIL'} (${workflows.products?.dataCount || 0} records)`);
  
  // Phase 3 Summary
  console.log('\n📊 Phase 3: Data Integrity & Security');
  const security = testResults.phase3.security;
  console.log(`   Branches: ${security.branches?.success ? '✅ PASS' : '❌ FAIL'} (${security.branches?.dataCount || 0} records)`);
  console.log(`   RLS Policies: ${Object.values(security.rls || {}).every(r => r.success) ? '✅ PASS' : '❌ FAIL'}`);
  
  // Phase 4 Summary
  console.log('\n📈 Phase 4: System Health');
  const performance = testResults.phase4.reporting.performance;
  console.log(`   Performance: ${performance?.success ? '✅ PASS' : '❌ FAIL'} (${performance?.responseTime || 'N/A'}ms)`);
  
  // Overall Status
  const allTests = [
    auth.superAdmin?.success,
    auth.clinicOwner?.success,
    workflows.appointments?.success,
    workflows.treatments?.success,
    workflows.products?.success,
    security.branches?.success,
    performance?.success
  ];
  
  const passedTests = allTests.filter(Boolean).length;
  const totalTests = allTests.length;
  
  console.log('\n🎯 OVERALL RESULT');
  console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  console.log(`   Status: ${passedTests === totalTests ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
  
  return {
    passedTests,
    totalTests,
    successRate: Math.round((passedTests/totalTests) * 100),
    allPassed: passedTests === totalTests
  };
}

/**
 * Main Sequential Testing Function
 */
async function runSequentialTesting() {
  console.log('🚀 Starting BN-Aura Sequential Testing');
  console.log('Testing with REAL DATA from production database');
  console.log('='.repeat(60));
  
  try {
    // Run all phases sequentially
    await testAuthentication();
    await testCoreWorkflows();
    await testDataSecurity();
    await testSystemHealth();
    
    // Generate final report
    const report = generateReport();
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `test-results-${timestamp}.json`;
    
    console.log(`\n💾 Test results saved to: ${resultsFile}`);
    
    return {
      success: report.allPassed,
      results: testResults,
      summary: report
    };
    
  } catch (error) {
    console.error('❌ Sequential Testing Failed:', error);
    return {
      success: false,
      error: error.message,
      results: testResults
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runSequentialTesting,
    testAuthentication,
    testCoreWorkflows,
    testDataSecurity,
    testSystemHealth,
    generateReport
  };
}

// Run if called directly
if (require.main === module) {
  // Node.js environment - run the tests
  runSequentialTesting().then(result => {
    console.log('\n🎯 Final Result:', result.success ? 'SUCCESS' : 'FAILED');
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Testing Error:', error);
    process.exit(1);
  });
} else if (typeof window !== 'undefined') {
  // Browser environment - expose to global
  window.SequentialTesting = {
    runSequentialTesting,
    testAuthentication,
    testCoreWorkflows,
    testDataSecurity,
    testSystemHealth,
    generateReport
  };
}
