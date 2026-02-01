---
description: Comprehensive security audit workflow using Supabase MCP
---

# Security Audit Workflow

Regular security auditing workflow to ensure system safety and compliance.

## Schedule
- **Daily**: Automated security checks
- **Weekly**: Manual security review
- **Monthly**: Comprehensive audit
- **Quarterly**: External penetration testing

## Phase 1: Automated Security Checks

### 1. Run Security Advisors
```
Use Supabase MCP: get_advisors
- project_id: "[project-id]"
- type: "security"
```

Review all findings:
- **ERROR**: Critical - Must fix immediately
- **WARN**: Important - Should fix soon
- **INFO**: Advisory - Consider fixing

### 2. Check RLS Status
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
```

Verify: All tables should have `rowsecurity = true`

### 3. Review RLS Policies
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname"
```

Check for:
- Multiple permissive policies (performance issue)
- Overly broad policies (security risk)
- Missing policies on new tables

### 4. Audit Database Functions
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT routine_name, security_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name"
```

Verify:
- All functions use `SECURITY DEFINER` appropriately
- No functions bypass RLS without good reason

### 5. Check Function Search Paths
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT proname, prosrc FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prosrc NOT LIKE '%search_path%'"
```

Functions should set: `SET search_path = public, pg_temp`

## Phase 2: Authentication & Authorization Review

### 1. Review User Roles
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT role, COUNT(*) FROM users GROUP BY role"
```

Verify:
- No unexpected super_admins
- Role distribution looks normal

### 2. Check Inactive Users
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT id, email, created_at, last_sign_in_at FROM auth.users WHERE last_sign_in_at < NOW() - INTERVAL '90 days' OR last_sign_in_at IS NULL"
```

Consider deactivating old accounts.

### 3. Review API Keys
```
Use Supabase MCP: get_publishable_keys
- project_id: "[project-id]"
```

Check:
- No disabled keys still in use
- Keys rotated regularly
- Service role key not exposed

### 4. Audit Permission Grants
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT grantee, table_schema, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public'"
```

## Phase 3: Data Protection Audit

### 1. Check Sensitive Data Encryption
Review tables containing:
- Personal information
- Payment details
- Health records
- Authentication credentials

```
Use Supabase MCP: list_tables
- project_id: "[project-id]"
- schemas: ["public"]
```

### 2. Verify Data Isolation
Test multi-tenant isolation:

```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "
  -- Attempt cross-clinic access (should return 0)
  SET request.jwt.claims TO '{\"clinic_id\": \"[clinic-a-id]\"}';
  SELECT COUNT(*) FROM customers WHERE clinic_id = '[clinic-b-id]';
"
```

Result should be 0 due to RLS.

### 3. Check Backup Status
Verify Supabase automatic backups via dashboard:
- Daily backups enabled
- Point-in-time recovery available
- Backup retention period adequate

### 4. Review Audit Logs
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT event_type, COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY event_type ORDER BY count DESC"
```

Look for anomalies:
- Unusual spike in failed logins
- Unexpected admin actions
- Mass data exports

## Phase 4: API Security Review

### 1. Check Rate Limiting
Review rate limiter configuration in code:
`lib/middleware/rateLimiter.ts`

Verify:
- Rate limits appropriate
- Different limits for different endpoints
- IP-based blocking working

### 2. Test API Endpoints
```
Use Playwright MCP: browser_navigate
- url: "https://bn-aura.vercel.app/api/[endpoint]"

Use Playwright MCP: browser_network_requests
- includeStatic: false
```

Verify:
- Authentication required
- Authorization checked
- Input validation working
- Error messages not leaking info

### 3. Review CORS Configuration
Check `next.config.js`:
```javascript
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'https://bn-aura.vercel.app' }
    ]
  }
]
```

### 4. Check Environment Variables
Review `.env.local` and Vercel environment:
- No secrets in code
- All sensitive vars encrypted
- Production uses different keys than dev

## Phase 5: Application Security Testing

### 1. Test SQL Injection Protection
```
Use Playwright MCP: browser_navigate
- url: "[form page]"

Use Playwright MCP: browser_type
- element: "search input"
- text: "'; DROP TABLE users; --"

Use Playwright MCP: browser_click
- element: "submit"
```

Should be handled safely (parameterized queries).

### 2. Test XSS Protection
```
Use Playwright MCP: browser_type
- element: "name input"
- text: "<script>alert('XSS')</script>"

Use Playwright MCP: browser_click
- element: "submit"
```

Should be escaped/sanitized.

### 3. Test CSRF Protection
Attempt to submit form from external site:
```
Use Playwright MCP: browser_navigate
- url: "http://malicious-site.com/csrf-test"
```

Should be blocked by Next.js CSRF protection.

### 4. Test File Upload Security
```
Use Playwright MCP: browser_file_upload
- paths: ["malicious.php", "exploit.exe"]
```

Should validate:
- File type
- File size
- File content (magic numbers)
- Storage location (isolated)

## Phase 6: Frontend Security Review

### 1. Check for Exposed Secrets
Search codebase:
```bash
grep -r "api.*key.*=.*['\"]" --exclude-dir=node_modules
grep -r "password.*=.*['\"]" --exclude-dir=node_modules
grep -r "secret.*=.*['\"]" --exclude-dir=node_modules
```

All should use `process.env`.

### 2. Review Client-Side Storage
```
Use Playwright MCP: browser_evaluate
- function: "() => { return { localStorage: Object.keys(localStorage), sessionStorage: Object.keys(sessionStorage), cookies: document.cookie } }"
```

Check:
- No sensitive data in localStorage
- Session tokens httpOnly
- Secure flag on cookies

### 3. Test Client-Side Validation Bypass
```
Use Playwright MCP: browser_evaluate
- function: "() => { document.querySelector('input[required]').removeAttribute('required'); }"
```

Server should still validate (never trust client).

## Phase 7: Infrastructure Security

### 1. Review Logs for Anomalies
```
Use Supabase MCP: get_logs
- project_id: "[project-id]"
- service: "api"
```

Look for:
- Repeated failed auth attempts
- Unusual traffic patterns
- Error spikes
- Slow queries (potential DoS)

### 2. Check Database Connections
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'"
```

Monitor connection pool usage.

### 3. Review Network Logs
```
Use Supabase MCP: get_logs
- project_id: "[project-id]"
- service: "realtime"
```

Check for:
- Suspicious IP addresses
- Unusual request patterns
- Failed connection attempts

## Phase 8: Compliance Check

### 1. GDPR Compliance (if applicable)
- [ ] Data minimization implemented
- [ ] User consent recorded
- [ ] Right to erasure functional
- [ ] Data portability available
- [ ] Privacy policy updated
- [ ] Data breach procedure documented

### 2. PDPA Compliance (Thailand)
- [ ] Personal data inventory complete
- [ ] Consent management working
- [ ] Data subject rights implemented
- [ ] Cross-border transfer documented
- [ ] Privacy notice displayed

### 3. Healthcare Data (if applicable)
- [ ] Medical records encrypted
- [ ] Access logging enabled
- [ ] Retention policies enforced
- [ ] Anonymization available

## Phase 9: Remediation

### 1. Prioritize Findings
**Critical (fix within 24h):**
- RLS disabled on tables
- SQL injection vulnerabilities
- Exposed secrets
- Authentication bypass

**High (fix within 1 week):**
- Missing indexes (security advisor)
- Function search_path issues
- Weak password policies
- Insufficient logging

**Medium (fix within 1 month):**
- Multiple permissive policies
- Unused indexes
- Deprecated dependencies

**Low (fix as time permits):**
- Code style issues
- Documentation gaps
- Nice-to-have improvements

### 2. Create Fix Branch
```
Use Supabase MCP: create_branch
- project_id: "[project-id]"
- name: "security-fixes-[date]"
```

### 3. Apply Security Fixes
```
Use Supabase MCP: apply_migration
- project_id: "[branch-project-id]"
- name: "security_fixes"
- query: "[security fix SQL]"
```

### 4. Verify Fixes
```
Use Supabase MCP: get_advisors
- project_id: "[branch-project-id]"
- type: "security"
```

Should show improvements.

### 5. Deploy Fixes
```
Use Supabase MCP: merge_branch
- branch_id: "[branch-id]"
```

## Phase 10: Documentation

### 1. Security Report
Document:
- Audit date
- Findings summary
- Severity breakdown
- Fixes applied
- Outstanding issues
- Recommendations

### 2. Update Security Docs
- Incident response plan
- Security policies
- Access control matrix
- Data classification guide

### 3. Team Training
Share findings with team:
- Common vulnerabilities found
- Best practices reinforced
- New security measures
- Tools and procedures

## Security Monitoring Dashboards

### Daily Checks
- [ ] Security advisor (no new ERRORs)
- [ ] Failed login attempts
- [ ] API error rates
- [ ] Database query times

### Weekly Checks
- [ ] User access review
- [ ] RLS policy audit
- [ ] Dependency updates
- [ ] SSL certificate expiry

### Monthly Checks
- [ ] Full security audit
- [ ] Compliance review
- [ ] Backup testing
- [ ] Disaster recovery drill

## Incident Response

If security issue found:

### 1. Assess Severity
- **Critical**: System compromise, data breach
- **High**: Vulnerability with PoC
- **Medium**: Theoretical vulnerability
- **Low**: Minor configuration issue

### 2. Contain Issue
For critical issues:
- Pause affected features
- Revoke compromised credentials
- Block malicious IPs
- Notify stakeholders

### 3. Investigate
- Check logs for exploitation
- Identify affected data
- Determine root cause
- Document timeline

### 4. Remediate
- Apply security fixes
- Rotate credentials
- Patch vulnerabilities
- Update security measures

### 5. Communicate
- Notify affected users (if data breach)
- Report to authorities (if required)
- Update security policies
- Conduct post-mortem

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] All functions use secure search_path
- [ ] No critical security advisors
- [ ] API keys rotated regularly
- [ ] No secrets in code
- [ ] Input validation working
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Audit logging active
- [ ] Backups verified
- [ ] SSL/TLS enforced
- [ ] Dependencies updated
- [ ] Security policies documented
- [ ] Team security trained
