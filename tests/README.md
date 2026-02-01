# BN-Aura E2E Testing Suite

Comprehensive End-to-End testing framework for the BN-Aura aesthetic clinic management platform using Playwright and Supabase MCP.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (recommended package manager)
- Access to BN-Aura Supabase project
- Test images (see [Test Images Setup](#test-images-setup))

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your test database credentials
```

### Environment Variables

Create `.env.local` with:
```env
BASE_URL=http://localhost:3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key
```

### Running Tests

```bash
# Run all tests
pnpm run test:e2e

# Run tests in headed mode (see browser)
pnpm run test:e2e:headed

# Run specific test suite
pnpm exec playwright test tests/auth/
pnpm exec playwright test tests/ai-workflows/
pnpm exec playwright test tests/sales-crm/
pnpm exec playwright test tests/multi-tenant/

# Run tests with UI mode
pnpm run test:e2e:ui

# Debug specific test
pnpm run test:e2e:debug -- tests/auth/authentication.spec.ts
```

## 🧪 Test Structure

```
tests/
├── auth/                     # Authentication & RBAC tests
│   └── authentication.spec.ts
├── ai-workflows/            # Magic Scan & AI analysis tests  
│   └── magic-scan.spec.ts
├── sales-crm/              # Sales pipeline & CRM tests
│   └── leads-management.spec.ts
├── multi-tenant/           # Data isolation & RLS security tests
│   └── data-isolation.spec.ts
├── utils/                  # Test utilities & helpers
│   ├── test-data.ts        # Test data constants
│   └── page-objects/       # Page object models
├── fixtures/               # Test assets
│   └── test-images/        # Images for AI analysis testing
└── supabase-setup.ts      # Database setup utilities
```

## 👥 User Roles & Test Scenarios

### Super Admin
- ✅ Full system access across all clinics
- ✅ Global analytics and management
- ✅ User and clinic management

### Clinic Owner
- ✅ Clinic-specific dashboard and analytics  
- ✅ Staff management and permissions
- ✅ Revenue tracking and reporting
- ❌ Cannot access other clinics' data

### Sales Staff
- ✅ Magic Scan analysis and AR simulation
- ✅ Lead management and CRM workflows
- ✅ Customer communication and proposals
- ❌ Cannot access admin functions

### Beautician
- ✅ Treatment protocols and task queue
- ✅ Customer progress tracking
- ❌ Cannot access sales or admin functions

### Customer
- ✅ Personal skin profile and treatment journey
- ✅ Appointment booking and chat
- ❌ Cannot access internal clinic functions

## 🤖 AI Workflow Testing

### Magic Scan Analysis
- **Facial Detection**: 468-point MediaPipe mapping
- **AI Processing**: Google Gemini skin analysis
- **Results Validation**: Score ranges, skin type detection
- **AR Simulation**: Treatment preview generation

### Test Images Required
Place these images in `tests/fixtures/test-images/`:
- `test-face-1.jpg` - Standard test subject
- `test-face-oily.jpg` - Oily skin characteristics
- `test-face-dry.jpg` - Dry skin characteristics  
- `test-face-combination.jpg` - Combination skin
- `invalid-file.txt` - Non-image for error testing

### AI Quota Testing
- ✅ Usage tracking per clinic
- ✅ Overage calculations
- ✅ Quota reset functionality
- ✅ Multi-tenant quota isolation

## 💼 Sales & CRM Workflows

### Lead Management
- **Lead Scoring**: AI-based priority assignment
- **Kanban Pipeline**: Drag & drop lead progression
- **Follow-up Automation**: Scheduled tasks and reminders
- **Proposal Generation**: AI-powered treatment recommendations

### Customer Communication
- **Integrated Chat**: Real-time messaging
- **AI Assistance**: Template suggestions and responses
- **Multi-channel**: Email, SMS, in-app notifications

### Commission Tracking
- **Real-time Calculations**: Based on clinic-specific rates
- **Performance Analytics**: Charts and metrics
- **Transaction History**: Detailed commission breakdown

## 🔒 Multi-Tenant Security Testing

### Row Level Security (RLS)
- ✅ Clinic data isolation verification
- ✅ Cross-clinic access prevention
- ✅ Branch-level data separation
- ✅ User permission boundaries

### Data Export Controls
- ✅ Role-based export restrictions
- ✅ Audit logging for data access
- ✅ Justification requirements
- ✅ Download tracking

### Database Policy Testing
- ✅ RLS policy enforcement
- ✅ Query filtering validation
- ✅ Direct URL access prevention

## 📊 Test Execution & Reporting

### Browser Coverage
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iPad Pro, Mobile Chrome
- **Cross-browser**: Compatibility validation

### Reporting Features
- **HTML Reports**: Interactive test results
- **Video Recording**: Failed test playback
- **Screenshots**: Error state captures
- **Performance Metrics**: Load time tracking

### CI/CD Integration
- **GitHub Actions**: Automated test runs
- **PR Comments**: Automated failure reporting
- **Nightly Runs**: Full regression testing
- **Security Scans**: RLS and permission validation

## 🛠️ Configuration Files

### Playwright Configuration
- `playwright.config.ts` - Main test configuration
- `tests/global-setup.ts` - Environment preparation
- `tests/global-teardown.ts` - Cleanup operations

### Page Object Models
- `auth-page.ts` - Authentication workflows
- `dashboard-page.ts` - Navigation and common actions
- Additional page objects for specific features

## 🚨 Troubleshooting

### Common Issues

**Tests fail with "Cannot find module '@playwright/test'"**
```bash
pnpm install
pnpm exec playwright install
```

**Database connection errors**
- Check `.env.local` configuration  
- Verify Supabase project access
- Ensure RLS policies are enabled

**AI analysis timeouts**
- Increase timeout in `playwright.config.ts`
- Check Gemini API key validity
- Verify test images are properly formatted

**Cross-browser test failures**
- Update browser versions: `npx playwright install`
- Check browser-specific CSS compatibility
- Review responsive design implementation

### Debug Mode
```bash
# Run single test with debug
pnpm exec playwright test --debug tests/auth/authentication.spec.ts

# Trace viewer for failed tests
pnpm exec playwright show-trace test-results/trace.zip
```

## 📈 Performance Benchmarks

### Target Performance Metrics
- **Login**: < 2 seconds
- **Magic Scan Analysis**: < 30 seconds  
- **Dashboard Load**: < 3 seconds
- **Multi-clinic Data Queries**: < 5 seconds

### Load Testing
```bash
# Performance test suite
pnpm exec playwright test tests/performance/
```

## 🔄 Continuous Integration

Tests run automatically on:
- **Pull Requests**: Core functionality validation
- **Main Branch**: Full regression suite
- **Nightly**: Complete security and performance testing
- **Manual Trigger**: On-demand comprehensive testing

## 📝 Contributing

1. **Add New Tests**: Follow existing structure and naming conventions
2. **Page Objects**: Create reusable page models for new features
3. **Test Data**: Update `test-data.ts` for new scenarios
4. **Documentation**: Update this README for new test categories

### Test Writing Guidelines
- Use descriptive test names
- Include both happy path and error scenarios
- Test multi-tenant data isolation for new features
- Add performance assertions for critical paths
- Include accessibility testing where applicable

## 📞 Support

For issues with the E2E testing framework:
1. Check existing test results in GitHub Actions
2. Review the troubleshooting section above
3. Contact the development team with specific error logs
4. Include browser, OS, and test environment details
