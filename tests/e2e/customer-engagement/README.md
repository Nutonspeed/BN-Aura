# Phase 10 Customer Engagement Platform - E2E Tests

This directory contains comprehensive end-to-end tests for the Phase 10 Customer Engagement Platform features using Playwright MCP.

## 📋 Test Coverage

### 1. Loyalty System (`loyalty-system.spec.ts`)
- ✅ Points accumulation from treatments
- ✅ Tier progression (Bronze → Silver → Gold → Platinum → Diamond)
- ✅ Reward redemption with points
- ✅ Achievement unlocking based on conditions
- ✅ Points transaction history
- ✅ Tier benefits display
- ✅ Staff view of customer loyalty data

### 2. Referral System (`referral-system.spec.ts`)
- ✅ Unique referral code generation
- ✅ Referral application during signup
- ✅ Referral tracking and status updates
- ✅ Reward distribution to both parties
- ✅ Multiple referrals handling
- ✅ Achievement unlocking for referrals
- ✅ Referral analytics for staff
- ✅ Self-referral prevention
- ✅ Social sharing features

### 3. Customer Dashboard (`customer-dashboard.spec.ts`)
- ✅ Profile overview display
- ✅ Loyalty status widget
- ✅ Upcoming appointments
- ✅ Treatment history
- ✅ Membership status
- ✅ Notifications center
- ✅ Quick actions
- ✅ Assigned sales representative
- ✅ Personalized recommendations
- ✅ Skin analysis results
- ✅ Mobile responsiveness

### 4. Full Journey Integration (`integration/full-journey.spec.ts`)
- ✅ Complete customer lifecycle
- ✅ New customer to Diamond tier progression
- ✅ Cross-feature interactions
- ✅ Data persistence across sessions
- ✅ Comprehensive journey tracking

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Playwright installed
- Test environment running (localhost:3000 or configured BASE_URL)

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Variables
```bash
# Optional: Override default base URL
export BASE_URL=http://localhost:3000

# Optional: Enable CI mode
export CI=true
```

## 🚀 Running Tests

### Using the Test Runner Script
```bash
# Run all customer engagement tests
node scripts/run-customer-engagement-tests.js --all

# Run specific test suites
node scripts/run-customer-engagement-tests.js --loyalty
node scripts/run-customer-engagement-tests.js --referral
node scripts/run-customer-engagement-tests.js --dashboard
node scripts/run-customer-engagement-tests.js --journey

# Run with visual browser
node scripts/run-customer-engagement-tests.js --all --headed

# Run with debug mode
node scripts/run-customer-engagement-tests.js --all --debug
```

### Using Playwright CLI
```bash
# Run all tests
npx playwright test --project=customer-engagement

# Run specific test file
npx playwright test tests/e2e/customer-engagement/loyalty-system.spec.ts --project=customer-engagement

# Run with specific options
npx playwright test tests/e2e/customer-engagement/ --project=customer-engagement --headed --debug
```

## 📊 Test Reports

After running tests, detailed reports are available at:
- **HTML Report**: `test-results/html-report/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/junit.xml`

Screenshots are saved in:
- `test-results/` directory for failures
- `test-results/journey/` for full journey progression

## 🏗️ Test Architecture

### Helper Functions
- `customer-helpers.ts`: Common customer operations
- `loyalty-helpers.ts`: Loyalty system specific helpers
- `data-setup.ts`: Test data creation and cleanup

### Test Data
- Automatically created before each test run
- Isolated for each test suite
- Cleaned up after tests complete

### Test Users
- `customer.e2e.1@bntest.com` / `CustomerE2E1!` - Primary test customer
- `customer.e2e.2@bntest.com` / `CustomerE2E2!` - Secondary test customer
- `customer.e2e.3@bntest.com` / `CustomerE2E3!` - Tertiary test customer

## 🔧 Configuration

### Playwright Config
The customer engagement tests use a dedicated Playwright project with:
- Desktop Chrome browser
- 1920x1080 viewport
- Camera, microphone, and notifications permissions
- 60-second timeout for complex flows
- 1 retry for flaky tests

### Test Environment
- Tests run against `http://localhost:3000` by default
- Override with `BASE_URL` environment variable
- Requires active development server or staging environment

## 📝 Best Practices

### Writing New Tests
1. Use existing helper functions when possible
2. Follow the page object pattern
3. Add descriptive test names
4. Include assertions for UI elements
5. Take screenshots for key moments

### Test Data Management
1. Use the data-setup helpers for test data
2. Ensure test isolation
3. Clean up data after tests
4. Use unique identifiers for test data

### Debugging Tips
1. Use `--headed` flag to watch tests run
2. Use `--debug` flag to pause execution
3. Check console logs in browser dev tools
4. Review screenshots and traces in reports

## 🐛 Troubleshooting

### Common Issues
1. **Tests fail to find elements**: Check if selectors are up to date
2. **Timeout errors**: Increase timeout in test or config
3. **Authentication failures**: Verify test user credentials
4. **Data conflicts**: Ensure proper test isolation

### Getting Help
1. Check test logs for error messages
2. Review HTML report for detailed failure information
3. Use Playwright Inspector to debug interactively
4. Check browser console for JavaScript errors

## 📈 Continuous Integration

### GitHub Actions
Tests can be integrated into CI/CD pipelines:

```yaml
- name: Run Customer Engagement Tests
  run: |
    npm run test:customer-engagement
```

### Docker Support
Tests can run in Docker containers:

```bash
docker run -it --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.40.0 node scripts/run-customer-engagement-tests.js
```

## 🎯 Success Metrics

### Test Coverage Goals
- 95%+ feature coverage
- All critical user journeys tested
- Cross-browser compatibility verified
- Mobile responsiveness validated

### Performance Targets
- Tests complete within 10 minutes
- Page loads under 3 seconds
- No memory leaks in test runs
- Stable test results ( <5% flakiness )

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [BN-Aura Development Guide](../docs/development.md)
- [Test Best Practices](../docs/testing-best-practices.md)
- [Customer Engagement Features](../docs/customer-engagement.md)
