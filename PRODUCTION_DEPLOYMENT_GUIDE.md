# Production Deployment Guide - Unified Workflow System

**Date**: February 1, 2026  
**System**: BN-Aura Multi-Tenant Unified Workflow  
**Status**: Ready for Production ✅

---

## Pre-Deployment Checklist

### Database Verification
- [ ] Run `mcp1_get_advisors` to verify no critical security warnings
- [ ] Verify all migrations applied correctly
- [ ] Test customer_code trigger on test database
- [ ] Verify all enum types and schema changes
- [ ] Backup production database

### Authentication
- [ ] Reset test user passwords and remove from production
- [ ] Verify authentication works with real user accounts
- [ ] Check role-based access control

### Performance
- [ ] Run performance tests with production-like data volume
- [ ] Verify index usage on common queries
- [ ] Check realtime subscription performance

### Environment
- [ ] Set production environment variables
- [ ] Configure logging settings
- [ ] Set up monitoring alerts

---

## Deployment Steps

### 1. Database Migration

```sql
-- 1. Fix customer_code auto-generation
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1000;

CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL THEN
    NEW.customer_code := 'CUST-' || LPAD(nextval('customer_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_customer_code ON customers;
CREATE TRIGGER set_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_code();

-- 2. Add beautician to clinic_role enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'beautician' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'clinic_role')
    ) THEN
        ALTER TYPE clinic_role ADD VALUE IF NOT EXISTS 'beautician';
    END IF;
END
$$;

-- 3. Add workflow_id to sales_commissions
ALTER TABLE sales_commissions
ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflow_states(id);

CREATE INDEX IF NOT EXISTS idx_sales_commissions_workflow_id 
ON sales_commissions(workflow_id);
```

### 2. Code Deployment

1. Deploy updated `eventBroadcaster.ts` with fallback mechanisms
2. Deploy any other code changes
3. Update environment variables if needed
4. Restart application services

### 3. Post-Deployment Verification

- [ ] Verify login works
- [ ] Create a test customer (check auto customer_code)
- [ ] Create a test workflow
- [ ] Check realtime events
- [ ] Verify workflow transitions

---

## Rollback Procedure

### Database Rollback

```sql
-- 1. Remove customer_code trigger
DROP TRIGGER IF EXISTS set_customer_code ON customers;
DROP FUNCTION IF EXISTS generate_customer_code();

-- 2. Remove workflow_id column (only if needed)
-- WARNING: This will delete existing data in this column
ALTER TABLE sales_commissions DROP COLUMN IF EXISTS workflow_id;
```

### Code Rollback

1. Restore previous version of `eventBroadcaster.ts`
2. Restart application services

---

## Monitoring & Support

### Key Metrics to Monitor
- Authentication success rate
- Workflow creation rate
- Realtime event delivery latency
- Database query performance
- API response times

### Support Contacts
- **Primary**: Clinic Support Team
- **Technical**: Development Team
- **Database**: DBA Team

---

## Deployment Schedule

### Recommended Timing
- **Day**: Weekend (Saturday)
- **Time**: 10:00 PM - 2:00 AM (lowest traffic)
- **Estimate**: 2-3 hours total

### Communication
- Notify users 48 hours in advance
- Send reminder 2 hours before deployment
- Send confirmation when deployment complete

---

## Post-Deployment Tasks

- [ ] Monitor system for 24 hours
- [ ] Check logs for any errors
- [ ] Verify all clinics can access the system
- [ ] Document any issues for follow-up fixes

---

## Security Considerations

- Ensure RLS policies are working correctly
- Verify sensitive data protection
- Check audit logging is enabled
- Verify password leak protection enabled

---

## Certification

- [ ] Database admin has reviewed and approved migrations
- [ ] Lead developer has reviewed and approved code changes
- [ ] QA team has verified testing results
- [ ] Operations team is prepared for deployment
