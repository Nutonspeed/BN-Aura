-- Test Data Isolation Script
-- This script tests that sales staff can only see their assigned customers

-- First, let's verify our test data
SELECT '=== CUSTOMER ASSIGNMENTS ===' as info;
SELECT 
    c.full_name as customer_name,
    c.customer_code,
    au.email as assigned_sales_email
FROM customers c
LEFT JOIN auth.users au ON c.assigned_sales_id = au.id
WHERE c.clinic_id = '00000000-0000-0000-0000-000000000001'
ORDER BY au.email, c.full_name;

-- Test 1: Check what customers each sales staff should see
SELECT '=== EXPECTED CUSTOMERS PER SALES STAFF ===' as info;
SELECT 
    au.email as sales_email,
    COUNT(*) as assigned_customers
FROM auth.users au
JOIN customers c ON au.id = c.assigned_sales_id
WHERE au.email IN ('salesstaff3@test.com', 'salesstaff4@test.com', 'salesstaff5@test.com')
GROUP BY au.email
ORDER BY au.email;

-- Test 2: Verify RLS policies are in place
SELECT '=== RLS POLICIES ON CUSTOMERS TABLE ===' as info;
SELECT 
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'customers' 
AND schemaname = 'public'
ORDER BY policyname;

-- Test 3: Check if RLS is enabled
SELECT '=== RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'customers' 
AND schemaname = 'public';

-- Note: To properly test RLS, we need to authenticate through the API
-- The RLS policies use auth.uid() which only works when authenticated
-- Testing through SQL directly won't work without proper JWT context
