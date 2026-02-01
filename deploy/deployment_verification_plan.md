# Deployment Verification Plan - Unified Workflow System

## Purpose
This document outlines the systematic verification steps to ensure the Unified Workflow System has been successfully deployed to production and is functioning correctly.

## Verification Timeline
- **Immediate**: During deployment (0-1 hours)
- **Short-term**: Post-deployment (1-24 hours)
- **Long-term**: Ongoing monitoring (1-7 days)

---

## 1. Database Migration Verification

### Schema Changes
- [ ] Verify `customer_code_seq` sequence exists
- [ ] Verify `generate_customer_code` function exists
- [ ] Verify `set_customer_code` trigger is active on customers table
- [ ] Verify `beautician` exists in clinic_role enum
- [ ] Verify `workflow_id` column exists in sales_commissions table
- [ ] Verify index exists on sales_commissions.workflow_id

```sql
-- Verification queries
SELECT * FROM pg_sequences WHERE sequencename = 'customer_code_seq';
SELECT proname, prosrc FROM pg_proc WHERE proname = 'generate_customer_code';
SELECT tgname FROM pg_trigger WHERE tgname = 'set_customer_code';
SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'clinic_role';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales_commissions' AND column_name = 'workflow_id';
SELECT indexname FROM pg_indexes WHERE tablename = 'sales_commissions' AND indexname = 'idx_sales_commissions_workflow_id';
```

### Security Verification
- [ ] Run security advisor to verify no critical issues
- [ ] Verify RLS policies are active on all tables
- [ ] Verify function search paths are set correctly

```sql
-- Security verification queries
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
SELECT p.proname, p.prosrc FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND p.proname LIKE '%workflow%' AND p.prosrc LIKE '%search_path%';
```

---

## 2. API & Backend Verification

### Core Functionality
- [ ] Create new customer (verify auto customer_code generation)
- [ ] Create new workflow (all stages)
- [ ] Transition workflow through stages
- [ ] Assign beautician to workflow (verify beautician role works)
- [ ] Verify commission calculation

### Test API Endpoints
- [ ] `POST /api/customers` - Create customer
- [ ] `GET /api/customers` - List customers
- [ ] `POST /api/workflow/unified` - Create workflow
- [ ] `PUT /api/workflow/unified/{id}` - Update workflow
- [ ] `GET /api/workflow/unified/sales` - List sales workflows
- [ ] `GET /api/workflow/unified/beautician` - List beautician workflows

---

## 3. Frontend Verification

### Auth & Login
- [ ] Verify login page loads
- [ ] Login with clinic owner account
- [ ] Login with sales staff account
- [ ] Login with beautician account
- [ ] Verify appropriate permissions for each role

### Critical UI Components
- [ ] Dashboard loads correctly
- [ ] Workflow Kanban board displays correctly
- [ ] Customer creation form works
- [ ] Workflow creation form works
- [ ] Realtime updates occur for workflow transitions

### Browser Testing
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile responsive view

---

## 4. Multi-tenant Isolation Testing

### Data Isolation
- [ ] Verify clinic A cannot see clinic B's customers
- [ ] Verify clinic A cannot see clinic B's workflows
- [ ] Verify clinic A cannot modify clinic B's workflows

### User Role Isolation
- [ ] Verify sales staff can only see appropriate workflows
- [ ] Verify beautician can only see appropriate workflows

---

## 5. Realtime Events Verification

### Event Broadcasting
- [ ] Verify workflow creation events broadcast
- [ ] Verify workflow transition events broadcast
- [ ] Verify events delivered to correct users/roles
- [ ] Test with multiple simultaneous users

### Fallback Mechanism
- [ ] Test fallback mechanism for RPC functions
- [ ] Verify polling works when needed

---

## 6. Performance Testing

### Response Times
- [ ] Measure login response time (target: < 1s)
- [ ] Measure workflow listing response time (target: < 2s)
- [ ] Measure workflow transition response time (target: < 1.5s)

### Database Performance
- [ ] Verify index usage for common queries
- [ ] Monitor query performance under load

---

## 7. Error Handling & Recovery

### Graceful Degradation
- [ ] Test system behavior when database is slow
- [ ] Test system behavior when services are unavailable
- [ ] Verify error messages are user-friendly

### Logging
- [ ] Verify critical operations are logged
- [ ] Verify errors are properly logged with context

---

## Issue Severity Classification

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| P0 - Critical | System down or unusable | Immediate | Authentication system failure |
| P1 - High | Major feature broken | 1 hour | Cannot create workflows |
| P2 - Medium | Feature degraded | 4 hours | Slow performance |
| P3 - Low | Minor issues | 24 hours | UI glitches |

---

## Verification Team & Responsibilities

| Role | Responsibility | Team Member |
|------|----------------|------------|
| DB Admin | Database verification | [NAME] |
| Backend Dev | API verification | [NAME] |
| Frontend Dev | UI verification | [NAME] |
| QA | End-to-end testing | [NAME] |
| DevOps | Infrastructure monitoring | [NAME] |

---

## Go/No-Go Decision Criteria

### Go Criteria (All Must Be Met)
- All P0 & P1 verification tests pass
- No critical security issues
- Data integrity verified
- Multi-tenant isolation confirmed
- Core user flows functioning

### No-Go Triggers (Any One Is Sufficient)
- Any P0 issue discovered
- Multiple P1 issues discovered
- Security vulnerability found
- Data isolation issue found

---

## Sign-Off Requirements

- [ ] Database Administrator sign-off
- [ ] Lead Developer sign-off
- [ ] QA Team sign-off
- [ ] Product Owner sign-off
- [ ] Operations Team sign-off
