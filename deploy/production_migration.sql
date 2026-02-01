-- Production Deployment Script - Unified Workflow System
-- Date: February 1, 2026
-- Purpose: Apply all fixes identified in E2E testing

-- START TRANSACTION
BEGIN;

-- Safety check to prevent running on wrong database
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Wrong database: customers table not found';
  END IF;
END
$$;

-- ============= SCHEMA FIXES =============

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

RAISE NOTICE 'Customer code auto-generation configured successfully';

-- 2. Add beautician to clinic_role enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'beautician' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'clinic_role')
    ) THEN
        ALTER TYPE clinic_role ADD VALUE IF NOT EXISTS 'beautician';
        RAISE NOTICE 'Added beautician role to clinic_role enum';
    ELSE
        RAISE NOTICE 'beautician role already exists in clinic_role enum';
    END IF;
END
$$;

-- 3. Add workflow_id to sales_commissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales_commissions' 
        AND column_name = 'workflow_id'
    ) THEN
        ALTER TABLE sales_commissions
        ADD COLUMN workflow_id UUID REFERENCES workflow_states(id);
        
        RAISE NOTICE 'Added workflow_id column to sales_commissions';
        
        CREATE INDEX IF NOT EXISTS idx_sales_commissions_workflow_id 
        ON sales_commissions(workflow_id);
        
        RAISE NOTICE 'Created index on sales_commissions.workflow_id';
    ELSE
        RAISE NOTICE 'workflow_id column already exists in sales_commissions';
    END IF;
END
$$;

-- ============= CLEANUP SCRIPT =============

-- 4. Clean up any test data that might have been deployed in pre-production environment
DELETE FROM workflow_events WHERE metadata->>'is_test' = 'true';
DELETE FROM sales_commissions WHERE transaction_type = 'test_transaction';
DELETE FROM workflow_states WHERE metadata->>'is_test' = 'true';
DELETE FROM customers WHERE email LIKE '%@example.com';

-- 5. Verify functions have search_path set correctly
DO $$
DECLARE
    func_name text;
    func_count int := 0;
    fixed_count int := 0;
BEGIN
    FOR func_name IN
        SELECT p.proname 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosrc NOT LIKE '%search_path%'
        AND p.proname LIKE '%workflow%'
    LOOP
        EXECUTE format($$
            ALTER FUNCTION public.%I SET search_path = public, pg_temp;
        $$, func_name);
        
        fixed_count := fixed_count + 1;
        RAISE NOTICE 'Fixed search_path for function: %', func_name;
    END LOOP;
    
    SELECT count(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%workflow%';
    
    RAISE NOTICE 'Total workflow functions: %, Fixed: %', func_count, fixed_count;
END
$$;

-- ============= FINAL VERIFICATION =============

-- 6. Final verification checks
DO $$
DECLARE
    table_count int;
    index_count int;
    rls_enabled_count int;
    function_count int;
BEGIN
    -- Check tables
    SELECT count(*) INTO table_count FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Check indexes
    SELECT count(*) INTO index_count FROM pg_indexes
    WHERE schemaname = 'public';
    
    -- Check RLS enabled tables
    SELECT count(*) INTO rls_enabled_count 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true;
    
    -- Check functions
    SELECT count(*) INTO function_count FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    RAISE NOTICE 'Database verification:';
    RAISE NOTICE '- Tables: %', table_count;
    RAISE NOTICE '- Indexes: %', index_count;
    RAISE NOTICE '- RLS Enabled Tables: %', rls_enabled_count;
    RAISE NOTICE '- Functions: %', function_count;
    
    -- Additional safety checks can be added here
END
$$;

-- COMMIT TRANSACTION
COMMIT;

-- ============= POST MIGRATION INSTRUCTIONS =============
-- 1. Restart the application server
-- 2. Verify authentication is working
-- 3. Create a test customer to verify auto customer_code
-- 4. Monitor logs for any errors
