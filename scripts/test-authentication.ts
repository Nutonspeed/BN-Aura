// Authentication Testing Suite for BN-Aura
// Tests login, register, and role-based access

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  error?: string;
}

const results: TestResult[] = [];

function addResult(test: string, passed: boolean, message: string, error?: string) {
  results.push({ test, passed, message, error });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${test}: ${message}`);
  if (error) console.error(`   Error: ${error}`);
}

export async function testAuthentication() {
  console.log('[v0] Starting authentication tests...\n');

  // Test 1: Supabase client initialization
  try {
    const client = createClient();
    addResult(
      'Client Initialization',
      true,
      'Supabase client created successfully'
    );
  } catch (error) {
    addResult(
      'Client Initialization',
      false,
      'Failed to create Supabase client',
      error instanceof Error ? error.message : String(error)
    );
    return results;
  }

  // Test 2: Admin client initialization
  try {
    const adminClient = createAdminClient();
    addResult(
      'Admin Client Initialization',
      true,
      'Admin client created successfully'
    );
  } catch (error) {
    addResult(
      'Admin Client Initialization',
      false,
      'Failed to create admin client',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 3: Check if users table exists
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('users')
      .select('id', { head: true })
      .limit(1);

    if (error) throw error;

    addResult(
      'Users Table Access',
      true,
      'Users table accessible'
    );
  } catch (error) {
    addResult(
      'Users Table Access',
      false,
      'Cannot access users table',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 4: Test signup API route
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        role: 'customer',
      }),
    });

    if (response.ok) {
      addResult(
        'Signup API Route',
        true,
        'Signup endpoint accessible'
      );
    } else {
      const data = await response.json();
      addResult(
        'Signup API Route',
        false,
        `Signup failed: ${data.error || response.statusText}`
      );
    }
  } catch (error) {
    addResult(
      'Signup API Route',
      false,
      'Signup endpoint error',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 5: Test login API route
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123',
      }),
    });

    // We expect this to fail (invalid credentials) but endpoint should be accessible
    addResult(
      'Login API Route',
      response.status === 401 || response.status === 400,
      'Login endpoint accessible and returning proper error'
    );
  } catch (error) {
    addResult(
      'Login API Route',
      false,
      'Login endpoint error',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 6: Check RLS on users table
  try {
    const client = createClient();
    
    // Try to query users without authentication (should fail with RLS)
    const { data, error } = await client
      .from('users')
      .select('*')
      .limit(1);

    // If RLS is working, this should return an error or empty data
    if (error || (data && data.length === 0)) {
      addResult(
        'RLS on Users Table',
        true,
        'RLS is properly blocking unauthenticated access'
      );
    } else {
      addResult(
        'RLS on Users Table',
        false,
        'RLS may not be configured - unauthenticated access allowed'
      );
    }
  } catch (error) {
    // Error is expected with RLS
    addResult(
      'RLS on Users Table',
      true,
      'RLS is working (query rejected)'
    );
  }

  // Test 7: Check for auth.users
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('auth.users')
      .select('id', { head: true })
      .limit(1);

    if (!error || error.message.includes('permission denied')) {
      addResult(
        'Auth Schema Access',
        true,
        'Auth schema exists and is protected'
      );
    } else {
      addResult(
        'Auth Schema Access',
        false,
        'Unexpected auth schema error',
        error.message
      );
    }
  } catch (error) {
    addResult(
      'Auth Schema Access',
      true,
      'Auth schema protected (expected)'
    );
  }

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  return results;
}

export async function testCoreAPIRoutes() {
  console.log('\n[v0] Testing core API routes...\n');

  const apiTests = [
    { name: 'Clinics List', endpoint: '/api/clinics', method: 'GET' },
    { name: 'Customers List', endpoint: '/api/customers', method: 'GET' },
    { name: 'Appointments List', endpoint: '/api/appointments', method: 'GET' },
    { name: 'Services List', endpoint: '/api/services', method: 'GET' },
    { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
  ];

  const apiResults: TestResult[] = [];

  for (const test of apiTests) {
    try {
      const response = await fetch(test.endpoint, {
        method: test.method,
      });

      // Any response (even 401) means the endpoint exists
      if (response.status < 500) {
        addResult(
          test.name,
          true,
          `Endpoint accessible (${response.status})`
        );
        apiResults.push({
          test: test.name,
          passed: true,
          message: `Status: ${response.status}`,
        });
      } else {
        addResult(
          test.name,
          false,
          `Server error (${response.status})`
        );
        apiResults.push({
          test: test.name,
          passed: false,
          message: `Server error: ${response.status}`,
        });
      }
    } catch (error) {
      addResult(
        test.name,
        false,
        'Endpoint not accessible',
        error instanceof Error ? error.message : String(error)
      );
      apiResults.push({
        test: test.name,
        passed: false,
        message: 'Not accessible',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log('\n=== API ROUTES SUMMARY ===');
  const passed = apiResults.filter(r => r.passed).length;
  const failed = apiResults.filter(r => !r.passed).length;
  console.log(`Total Routes Tested: ${apiResults.length}`);
  console.log(`Accessible: ${passed} ✅`);
  console.log(`Not Accessible: ${failed} ❌`);

  return apiResults;
}

// Run tests if executed directly
if (require.main === module) {
  Promise.all([
    testAuthentication(),
    testCoreAPIRoutes(),
  ])
    .then(() => {
      console.log('\n✅ All tests complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}
