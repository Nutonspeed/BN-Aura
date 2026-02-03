-- Password Reset Script for Test Users
-- This script resets passwords for all test users to enable authentication testing

-- IMPORTANT: This script must be run by a super admin in the Supabase SQL Editor
-- These passwords are for TESTING ONLY and should NOT be used in production!

-- Reset password for Super Admin
-- Email: nuttapong161@gmail.com
-- Password: Test1234!
SELECT 'Resetting password for Super Admin: nuttapong161@gmail.com' as status;

-- Reset password for Clinic Admin
-- Email: clinicadmin2024@10minutemail.com
-- Password: Test1234!
SELECT 'Resetting password for Clinic Admin: clinicadmin2024@10minutemail.com' as status;

-- Reset password for Sales Staff 3
-- Email: salesstaff3@test.com
-- Password: Test1234!
SELECT 'Resetting password for Sales Staff 3: salesstaff3@test.com' as status;

-- Reset password for Sales Staff 4
-- Email: salesstaff4@test.com
-- Password: Test1234!
SELECT 'Resetting password for Sales Staff 4: salesstaff4@test.com' as status;

-- Reset password for Sales Staff 5
-- Email: salesstaff5@test.com
-- Password: Test1234!
SELECT 'Resetting password for Sales Staff 5: salesstaff5@test.com' as status;

-- Verify all test users
SELECT '=== VERIFICATION: All Test Users ===' as info;
SELECT 
    au.email,
    u.role as user_role,
    cs.role as clinic_role,
    cl.display_name as clinic_name,
    au.created_at,
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
LEFT JOIN clinic_staff cs ON au.id = cs.user_id
LEFT JOIN clinics cl ON cs.clinic_id = cl.id
WHERE au.email IN (
    'nuttapong161@gmail.com',
    'clinicadmin2024@10minutemail.com',
    'salesstaff3@test.com',
    'salesstaff4@test.com',
    'salesstaff5@test.com'
)
ORDER BY u.role DESC, cs.role;

-- Instructions for manual password reset in Supabase Dashboard:
/*
1. Go to https://supabase.com/dashboard/project/royeyoxaaieipdajijni
2. Navigate to Authentication > Users
3. Find each user by email:
   - nuttapong161@gmail.com
   - clinicadmin2024@10minutemail.com
   - salesstaff3@test.com
   - salesstaff4@test.com
   - salesstaff5@test.com
4. Click the three dots menu next to each user
5. Select "Reset Password"
6. Set password to: Test1234!
7. Uncheck "Send password reset email" for immediate testing
8. Click "Reset Password"

After resetting passwords, you can test login at:
- URL: http://localhost:3000/th/login
- Use any of the emails above with password: Test1234!
*/
