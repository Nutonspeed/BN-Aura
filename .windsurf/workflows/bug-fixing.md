---
description: Bug fixing and hotfix deployment workflow
---

# Bug Fixing Workflow

Systematic approach to identifying, fixing, and deploying bug fixes using MCP tools.

## Phase 1: Bug Identification

### 1. Reproduce the Bug
```
Use Playwright MCP: browser_navigate
- url: "[url where bug occurs]"

Use Playwright MCP: browser_snapshot
- filename: "bug-initial-state.md"
```

### 2. Perform Actions that Trigger Bug
```
Use Playwright MCP: browser_click
Use Playwright MCP: browser_type
Use Playwright MCP: browser_fill_form
(whatever actions cause the bug)
```

### 3. Capture Error State
```
Use Playwright MCP: browser_console_messages
- level: "error"
- filename: "bug-console-errors.txt"

Use Playwright MCP: browser_take_screenshot
- filename: "bug-error-state.png"

Use Playwright MCP: browser_network_requests
- includeStatic: false
- filename: "bug-network-log.txt"
```

### 4. Check Production Logs
```
Use Supabase MCP: get_logs
- project_id: "[production-project-id]"
- service: "api"

Use Supabase MCP: get_logs
- project_id: "[production-project-id]"
- service: "postgres"
```

### 5. Investigate Database State
```
Use Supabase MCP: execute_sql
- project_id: "[production-project-id]"
- query: "SELECT * FROM [relevant_table] WHERE [condition]"
```

## Phase 2: Root Cause Analysis

### 1. Check for Related Issues
Review:
- Similar error patterns in logs
- Recent code changes (git log)
- Database migration history

### 2. Verify RLS Policies
```
Use Supabase MCP: execute_sql
- project_id: "[production-project-id]"
- query: "SELECT * FROM pg_policies WHERE tablename = '[table]'"
```

### 3. Check for Missing Indexes
```
Use Supabase MCP: get_advisors
- project_id: "[production-project-id]"
- type: "performance"
```

### 4. Analyze Function Security
```
Use Supabase MCP: get_advisors
- project_id: "[production-project-id]"
- type: "security"
```

## Phase 3: Fix Development

### 1. Create Hotfix Branch
```
Use Supabase MCP: create_branch
- project_id: "[production-project-id]"
- name: "hotfix-[bug-description]"
- confirm_cost_id: "[from confirm_cost]"
```

### 2. Apply Database Fix (if needed)
```
Use Supabase MCP: apply_migration
- project_id: "[hotfix-branch-project-id]"
- name: "fix_[bug_name]"
- query: "[fix SQL]"
```

Examples:

**Fix Missing Index:**
```sql
CREATE INDEX idx_table_column ON table_name(column_name);
```

**Fix RLS Policy:**
```sql
DROP POLICY IF EXISTS "old_policy" ON table_name;
CREATE POLICY "new_policy" ON table_name
  FOR ALL USING (clinic_id = auth.get_clinic_id());
```

**Fix Function:**
```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Fixed logic
END;
$$;
```

### 3. Test Fix on Branch
```
Use Supabase MCP: execute_sql
- project_id: "[hotfix-branch-project-id]"
- query: "[test query]"
```

### 4. Update Frontend Code (if needed)
Make code changes in:
- Components
- API routes
- Business logic

### 5. Local Testing
Update `.env.local` with hotfix branch URL.

// turbo
```bash
npm run dev
```

### 6. Reproduce Bug Scenario
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/[bug-path]"

(repeat actions that caused bug)

Use Playwright MCP: browser_snapshot
Use Playwright MCP: browser_console_messages
```

### 7. Verify Fix
```
Use Playwright MCP: browser_snapshot
- filename: "bug-fixed-state.md"

Use Playwright MCP: browser_console_messages
- level: "error"
(should show no errors now)
```

## Phase 4: Validation

### 1. Security Re-check
```
Use Supabase MCP: get_advisors
- project_id: "[hotfix-branch-project-id]"
- type: "security"
```

### 2. Performance Re-check
```
Use Supabase MCP: get_advisors
- project_id: "[hotfix-branch-project-id]"
- type: "performance"
```

### 3. Run Regression Tests
// turbo
```bash
npm run test:e2e
```

Ensure fix doesn't break other features.

### 4. Create Test for Bug
Add test to prevent regression:
`tests/bugs/[bug-name].spec.ts`

```typescript
test('Bug [ID]: [description]', async ({ page }) => {
  // Steps to reproduce original bug
  // Verify it doesn't happen anymore
});
```

## Phase 5: Deployment

### 1. Review Fix
Double-check:
- [ ] Bug root cause identified
- [ ] Fix applied correctly
- [ ] Tests passing
- [ ] No new issues introduced
- [ ] Documentation updated

### 2. Merge Hotfix
```
Use Supabase MCP: merge_branch
- branch_id: "[hotfix-branch-id]"
```

### 3. Deploy Frontend
```bash
git add .
git commit -m "fix: [bug description] (#issue-number)"
git push origin main
```

### 4. Monitor Deployment
Watch Vercel deployment:
- Build success
- No new errors

### 5. Production Verification
```
Use Playwright MCP: browser_navigate
- url: "https://bn-aura.vercel.app/[bug-path]"

(reproduce original bug scenario)

Use Playwright MCP: browser_snapshot
Use Playwright MCP: browser_console_messages
```

### 6. Monitor Logs
```
Use Supabase MCP: get_logs
- project_id: "[production-project-id]"
- service: "api"
```

Watch for 30-60 minutes after deployment.

### 7. Verify with Users
- Notify affected users
- Ask them to re-test
- Confirm bug resolved

## Phase 6: Documentation

### 1. Update Bug Report
Document:
- Root cause
- Fix applied
- Testing performed
- Prevention measures

### 2. Update Tests
Ensure regression test added.

### 3. Update Documentation
If bug revealed gap in docs:
- Update user guides
- Update developer docs
- Update troubleshooting guide

### 4. Post-mortem (for critical bugs)
Conduct team review:
- What caused the bug?
- Why wasn't it caught earlier?
- How to prevent similar issues?
- What processes need improvement?

## Common Bug Patterns

### Pattern 1: RLS Policy Blocking Data
**Symptom:** Query returns empty or error  
**Root Cause:** RLS policy too restrictive  
**Fix:**
```sql
-- Check current policy
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Fix policy
DROP POLICY IF EXISTS "restrictive_policy" ON table_name;
CREATE POLICY "correct_policy" ON table_name
  FOR SELECT USING (
    clinic_id = auth.get_clinic_id() OR
    user_id = auth.uid()
  );
```

### Pattern 2: Missing Foreign Key Index
**Symptom:** Slow queries  
**Root Cause:** No index on foreign key  
**Fix:**
```sql
CREATE INDEX idx_table_foreign_key ON table_name(foreign_key_column);
```

### Pattern 3: Realtime Not Working
**Symptom:** No live updates  
**Root Cause:** RPC function fails, no fallback  
**Fix:**
```typescript
// Implement polling fallback
async function getRecentEvents() {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('subscribe_to_workflow_events', {...});
    if (!error && data) return data;
    
    // Fallback to direct query
    const { data: fallbackData } = await supabase
      .from('workflow_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return fallbackData || [];
  } catch (err) {
    console.error('Failed to get events:', err);
    return [];
  }
}
```

### Pattern 4: Commission Not Calculated
**Symptom:** Commission missing after payment  
**Root Cause:** Trigger not firing or function error  
**Fix:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%commission%';

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_commission_calculation ON workflow_states;
CREATE TRIGGER trigger_commission_calculation
  AFTER UPDATE ON workflow_states
  FOR EACH ROW
  WHEN (NEW.current_stage = 'payment_confirmed' AND OLD.current_stage != 'payment_confirmed')
  EXECUTE FUNCTION trigger_commission_calculation();
```

### Pattern 5: Customer Code Null Error
**Symptom:** Cannot create customer  
**Root Cause:** No auto-generation trigger  
**Fix:**
```sql
-- Create sequence
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1000;

-- Create trigger function
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL THEN
    NEW.customer_code := 'CUST-' || LPAD(nextval('customer_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_code();
```

## Emergency Rollback

If fix causes worse issues:

### 1. Create Rollback Migration
```
Use Supabase MCP: apply_migration
- project_id: "[production-project-id]"
- name: "rollback_[fix_name]"
- query: "[SQL to undo changes]"
```

### 2. Revert Code Changes
```bash
git revert [commit-hash]
git push origin main
```

### 3. Monitor Recovery
```
Use Supabase MCP: get_logs
Use Playwright MCP: browser_navigate
(verify system stable)
```

## Bug Priority Levels

**P0 - Critical (Fix immediately)**
- System down
- Data corruption
- Security breach
- Payment failures

**P1 - High (Fix within 24h)**
- Major feature broken
- Performance degradation
- Multi-user impact

**P2 - Medium (Fix within week)**
- Minor feature issue
- UI/UX problems
- Single user impact

**P3 - Low (Fix in next sprint)**
- Cosmetic issues
- Edge cases
- Enhancement requests

## Prevention Checklist

- [ ] Add regression test
- [ ] Update validation rules
- [ ] Improve error messages
- [ ] Add logging/monitoring
- [ ] Update documentation
- [ ] Review related code
- [ ] Consider refactoring
- [ ] Share learnings with team
