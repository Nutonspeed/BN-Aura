#!/usr/bin/env node

/**
 * Phase 10 Customer Engagement Platform Test Runner
 * 
 * Usage:
 *   node run-customer-engagement-tests.js [options]
 * 
 * Options:
 *   --all         Run all customer engagement tests
 *   --loyalty     Run only loyalty system tests
 *   --referral    Run only referral system tests
 *   --dashboard   Run only customer dashboard tests
 *   --journey     Run only full journey tests
 *   --headed      Run tests in headed mode
 *   --debug       Run tests with debug logging
 */

const { spawn } = require('child_process');
const path = require('path');

const testSuites = {
  all: 'tests/e2e/customer-engagement',
  loyalty: 'tests/e2e/customer-engagement/loyalty-system.spec.ts',
  referral: 'tests/e2e/customer-engagement/referral-system.spec.ts',
  dashboard: 'tests/e2e/customer-engagement/customer-dashboard.spec.ts',
  journey: 'tests/e2e/customer-engagement/integration/full-journey.spec.ts'
};

function runTests(suite, options = {}) {
  const testPath = testSuites[suite];
  if (!testPath) {
    console.error(`Unknown test suite: ${suite}`);
    process.exit(1);
  }

  const playwrightArgs = [
    'npx',
    'playwright',
    'test',
    testPath,
    '--project=customer-engagement'
  ];

  if (options.headed) {
    playwrightArgs.push('--headed');
  }

  if (options.debug) {
    playwrightArgs.push('--debug');
  }

  if (options.updateSnapshots) {
    playwrightArgs.push('--update-snapshots');
  }

  // Add reporter options
  playwrightArgs.push('--reporter=html');
  playwrightArgs.push('--reporter=json');
  playwrightArgs.push('--reporter=junit');

  console.log(`\n🚀 Running Phase 10 Customer Engagement Tests`);
  console.log(`📁 Test Suite: ${suite}`);
  console.log(`📂 Path: ${testPath}`);
  console.log(`\n⏳ Starting tests...\n`);

  const testProcess = spawn('npx', playwrightArgs.slice(1), {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
    env: {
      ...process.env,
      BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
      CI: process.env.CI || null
    }
  });

  testProcess.on('close', (code) => {
    console.log(`\n${code === 0 ? '✅' : '❌'} Tests completed with exit code: ${code}`);
    
    if (code === 0) {
      console.log('\n📊 View detailed report:');
      console.log(`   open test-results/html-report/index.html`);
    }
    
    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error('❌ Failed to start tests:', error);
    process.exit(1);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  headed: args.includes('--headed'),
  debug: args.includes('--debug'),
  updateSnapshots: args.includes('--update-snapshots')
};

// Remove option flags to get the test suite
const suiteArg = args.find(arg => !arg.startsWith('--'));
const suite = suiteArg || 'all';

// Run the tests
runTests(suite, options);
