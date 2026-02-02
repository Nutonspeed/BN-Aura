---
description: Complete feature development cycle with MCP tools
---

# Feature Development Workflow

Complete workflow for developing new features using Supabase MCP and Playwright MCP.

## Phase 1: Planning & Setup

### 1. Document Feature Requirements
Create feature specification document with:
- User stories
- Database schema changes
- API endpoints needed
- UI components required
- Test scenarios

### 2. Estimate Cost
```
Use Supabase MCP: get_cost
- type: "branch"
- organization_id: "[org-id]"
```

### 3. Confirm Cost
```
Use Supabase MCP: confirm_cost
- type: "branch"
- recurrence: "hourly"
- amount: [from get_cost]
```

### 4. Create Development Branch
```
Use Supabase MCP: create_branch
- project_id: "[main-project-id]"
- name: "feature-[feature-name]"
- confirm_cost_id: "[from confirm_cost]"
```

## Phase 2: Database Development

### 1. Design Schema
Write migration SQL for:
- New tables
- Indexes
- RLS policies
- Functions/triggers
- Seed data

### 2. Apply Migration
```
Use Supabase MCP: apply_migration
- project_id: "[branch-project-id]"
- name: "feature_[feature_name]_schema"
- query: "[migration SQL]"
```

### 3. Verify Schema
```
Use Supabase MCP: list_tables
- project_id: "[branch-project-id]"
- schemas: ["public"]
```

### 4. Test Data Operations
```
Use Supabase MCP: execute_sql
- project_id: "[branch-project-id]"
- query: "INSERT INTO [new_table] (...) VALUES (...)"

Use Supabase MCP: execute_sql
- project_id: "[branch-project-id]"
- query: "SELECT * FROM [new_table]"
```

### 5. Security Audit
```
Use Supabase MCP: get_advisors
- project_id: "[branch-project-id]"
- type: "security"
```

Fix any issues found:
```
Use Supabase MCP: apply_migration
- project_id: "[branch-project-id]"
- name: "fix_[issue]"
- query: "[fix SQL]"
```

### 6. Performance Check
```
Use Supabase MCP: get_advisors
- project_id: "[branch-project-id]"
- type: "performance"
```

Add missing indexes:
```
Use Supabase MCP: apply_migration
- project_id: "[branch-project-id]"
- name: "add_indexes"
- query: "CREATE INDEX ..."
```

### 7. Generate Types
```
Use Supabase MCP: generate_typescript_types
- project_id: "[branch-project-id]"
```

Copy types to: `lib/supabase/database.types.ts`

## Phase 3: Frontend Development

### 1. Update Environment
Update `.env.local` with branch database URL:
```
NEXT_PUBLIC_SUPABASE_URL=[branch-url]
```

### 2. Create Components
Develop UI components in:
- `components/[feature-name]/`
- `app/[locale]/(dashboard)/[route]/`

### 3. Implement API Routes
Create API endpoints in:
- `app/api/[feature-name]/route.ts`

### 4. Add Business Logic
Create libraries in:
- `lib/[feature-name]/`

### 5. Manual Testing
// turbo
```bash
npm run dev
```

Test in browser:
- Navigate to feature pages
- Test all user interactions
- Verify data flow
- Check responsive design

## Phase 4: Automated Testing

### 1. Write E2E Tests
Create test file:
`tests/[category]/[feature-name].spec.ts`

### 2. Run Tests Locally
// turbo
```bash
npm run test:e2e:headed
```

### 3. Test with Playwright MCP

#### Navigate to Feature
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/th/[feature-path]"
```

#### Test User Flow
```
Use Playwright MCP: browser_snapshot
Use Playwright MCP: browser_fill_form
Use Playwright MCP: browser_click
Use Playwright MCP: browser_wait_for
```

#### Verify Database
```
Use Supabase MCP: execute_sql
- project_id: "[branch-project-id]"
- query: "SELECT * FROM [table] WHERE ..."
```

#### Check for Errors
```
Use Playwright MCP: browser_console_messages
- level: "error"

Use Playwright MCP: browser_network_requests
- includeStatic: false
```

#### Capture Evidence
```
Use Playwright MCP: browser_take_screenshot
- filename: "feature-[feature-name]-working.png"
```

### 4. Performance Testing
```
Use Playwright MCP: browser_evaluate
- function: "() => { return performance.timing }"
```

Verify:
- Page load < 2s
- API calls < 500ms

## Phase 5: Code Review & Quality

### 1. Run Linting
// turbo
```bash
npm run lint
```

### 2. Type Check
// turbo
```bash
npx tsc --noEmit
```

### 3. Build Test
// turbo
```bash
npm run build
```

### 4. Review Checklist
- [ ] Code follows style guide
- [ ] TypeScript types correct
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility considered
- [ ] Security best practices followed
- [ ] Performance optimized
- [ ] Tests passing
- [ ] Documentation updated

## Phase 6: Pre-Merge Validation

### 1. Final Security Audit
```
Use Supabase MCP: get_advisors
- project_id: "[branch-project-id]"
- type: "security"
```

Should show 0 critical issues.

### 2. Final Performance Check
```
Use Supabase MCP: get_advisors
- project_id: "[branch-project-id]"
- type: "performance"
```

### 3. Full Test Suite
// turbo
```bash
npm run test:e2e
```

All tests must pass.

### 4. Check Logs
```
Use Supabase MCP: get_logs
- project_id: "[branch-project-id]"
- service: "postgres"
```

No errors should appear.

## Phase 7: Merge to Production

### 1. Rebase Branch (if needed)
```
Use Supabase MCP: rebase_branch
- branch_id: "[branch-id]"
```

### 2. Final Migration Review
Review all migrations applied:
```
Use Supabase MCP: list_migrations
- project_id: "[branch-project-id]"
```

### 3. Merge Branch
```
Use Supabase MCP: merge_branch
- branch_id: "[branch-id]"
```

### 4. Update Environment
Update `.env.local` back to production URL.

### 5. Deploy Frontend
```bash
git add .
git commit -m "feat: [feature description]"
git push origin main
```

Vercel will auto-deploy.

## Phase 8: Post-Deployment

### 1. Verify Production Database
```
Use Supabase MCP: execute_sql
- project_id: "[main-project-id]"
- query: "SELECT * FROM [new_table] LIMIT 10"
```

### 2. Smoke Test Production
```
Use Playwright MCP: browser_navigate
- url: "https://bn-aura.vercel.app/th/[feature-path]"

Use Playwright MCP: browser_snapshot
```

Test critical user flows.

### 3. Monitor Logs
```
Use Supabase MCP: get_logs
- project_id: "[main-project-id]"
- service: "api"
```

Watch for 15-30 minutes for errors.

### 4. Monitor Performance
Check Vercel Analytics:
- Response times
- Error rates
- User activity

### 5. Delete Development Branch
```
Use Supabase MCP: delete_branch
- branch_id: "[branch-id]"
```

## Rollback Procedure

If issues occur in production:

### 1. Create Hotfix Branch
```
Use Supabase MCP: create_branch
- project_id: "[main-project-id]"
- name: "hotfix-[issue]"
```

### 2. Apply Rollback Migration
```
Use Supabase MCP: apply_migration
- project_id: "[hotfix-branch-project-id]"
- name: "rollback_[feature]"
- query: "DROP TABLE IF EXISTS [table]; ..."
```

### 3. Test Rollback
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000"
(test that system works without feature)
```

### 4. Merge Hotfix
```
Use Supabase MCP: merge_branch
- branch_id: "[hotfix-branch-id]"
```

## Feature Completion Checklist

- [ ] Requirements met
- [ ] Database schema correct
- [ ] RLS policies working
- [ ] Functions secured
- [ ] Indexes optimized
- [ ] Types generated
- [ ] UI components complete
- [ ] API endpoints working
- [ ] Business logic implemented
- [ ] E2E tests passing
- [ ] Security audit passed
- [ ] Performance verified
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Branch merged
- [ ] Production deployed
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Team notified

## Success Metrics

Track after 1 week:
- Feature adoption rate
- Error rate
- Performance impact
- User feedback
- Support tickets

## Documentation Updates

Update these files:
- [ ] README.md
- [ ] COMPREHENSIVE_PROJECT_PLAN.md
- [ ] API documentation
- [ ] User guides
- [ ] Training materials
