---
description: Safe database migration workflow using Supabase MCP
---

# Database Migration Workflow

This workflow guides you through safely applying database migrations using Supabase MCP.

## Prerequisites
- Supabase project ID
- Migration SQL prepared
- Backup completed (via Supabase dashboard)

## Steps

### 1. Create Development Branch
Create a separate branch to test migrations safely:
```
Use Supabase MCP: create_branch
- project_id: [your-project-id]
- name: "migration-[date]-[feature-name]"
- confirm_cost_id: [get from confirm_cost first]
```

### 2. Get Branch Project ID
List branches to get the new branch's project ID:
```
Use Supabase MCP: list_branches
- project_id: [main-project-id]
```

### 3. Apply Migration to Branch
Test migration on branch first:
```
Use Supabase MCP: apply_migration
- project_id: [branch-project-id]
- name: "[migration_name]"
- query: "[your SQL migration]"
```

### 4. Verify Migration
Check that tables and data are correct:
```
Use Supabase MCP: list_tables
- project_id: [branch-project-id]
- schemas: ["public"]

Use Supabase MCP: execute_sql
- project_id: [branch-project-id]
- query: "SELECT * FROM [new_table] LIMIT 10;"
```

### 5. Run Security Audit
Check for security issues:
```
Use Supabase MCP: get_advisors
- project_id: [branch-project-id]
- type: "security"
```

### 6. Check Performance
Verify indexes and performance:
```
Use Supabase MCP: get_advisors
- project_id: [branch-project-id]
- type: "performance"
```

### 7. Fix Any Issues
If advisors report issues, fix them:
```
Use Supabase MCP: apply_migration
- project_id: [branch-project-id]
- name: "fix_[issue_name]"
- query: "[fix SQL]"
```

### 8. Generate TypeScript Types
Update type definitions:
```
Use Supabase MCP: generate_typescript_types
- project_id: [branch-project-id]
```

### 9. Test with E2E
Run Playwright tests against branch database:
- Update .env.local with branch URL
- Run: `npm run test:e2e`

### 10. Merge to Production
If all tests pass:
```
Use Supabase MCP: merge_branch
- branch_id: [branch-id]
```

### 11. Verify Production
Check production database:
```
Use Supabase MCP: execute_sql
- project_id: [main-project-id]
- query: "SELECT * FROM [new_table] LIMIT 10;"
```

### 12. Monitor Logs
Watch for errors:
```
Use Supabase MCP: get_logs
- project_id: [main-project-id]
- service: "postgres"
```

## Rollback Procedure

If migration causes issues:

1. Create new migration to rollback:
```sql
DROP TABLE IF EXISTS [problematic_table];
-- Restore previous state
```

2. Apply rollback migration
3. Reset branch if needed:
```
Use Supabase MCP: reset_branch
- branch_id: [branch-id]
```

## Safety Checklist
- [ ] Backup completed
- [ ] Migration tested on branch
- [ ] Security audit passed
- [ ] Performance check passed
- [ ] E2E tests passed
- [ ] Types generated
- [ ] Team notified
