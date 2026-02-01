# Test User Credentials for E2E Testing

This file contains the test user credentials that can be used for E2E testing of the unified workflow system.

## Available Test Users

### Clinic Owners

1. **BN Test Clinic Owner**
   - **Email**: `testclinicowner2024@10minutemail.com`
   - **Role**: clinic_owner
   - **Clinic**: BN Test Clinic สาขาใหม่
   - **Clinic ID**: f3569c4b-6398-4167-85f9-e4c5740b25e3

2. **E2E Test Clinic Owner**
   - **Email**: `nuttapong161@gmail.com`
   - **Role**: clinic_owner
   - **Clinic**: E2E Test Clinic - Professional
   - **Clinic ID**: abb23589-6706-4319-91b7-9fd40e67d3b5

### Sales Staff

1. **Sales Staff 1**
   - **Email**: `nxluibrxppiiiwfobr@xfavaj.com`
   - **Role**: sales_staff
   - **Clinic**: BN Test Clinic สาขาใหม่
   - **Clinic ID**: f3569c4b-6398-4167-85f9-e4c5740b25e3
   - **User ID**: c964d8e5-077b-4e57-9d1d-95eef569a931

2. **Sales Staff 2**
   - **Email**: `nxbyrfuppwcgdybrfq@nespj.com`
   - **Role**: sales_staff
   - **Clinic**: BN Test Clinic สาขาใหม่
   - **Clinic ID**: f3569c4b-6398-4167-85f9-e4c5740b25e3
   - **User ID**: 4f9ef685-5572-4f08-95e1-cb70398cbab0

## Password Reset Instructions

Since the existing passwords may not be working, here's how to reset them:

1. **Using Supabase Dashboard:**
   - Go to Authentication > Users
   - Find the user by email
   - Click on the three dots menu and select "Reset Password"
   - Set a new password (e.g., `Testing123!`)

2. **Using Email Password Reset (if emails configured):**
   - Send a password reset email to the user
   - Reset the password to a known value

## Test Data

We've created test data linked to these users:

- **Workflows**: We've created multiple test workflows in various stages for testing
- **Customers**: Test customers created with auto-generated customer codes
- **Commissions**: Test commission records created for payment_confirmed workflows

## Testing Instructions

1. Use the credentials above to log in to the system
2. Navigate to `/th/sales/workflow` to view the Sales Workflow Kanban board
3. Navigate to `/th/beautician/workflow` to view the Beautician Task Queue
4. Verify that test data appears correctly

## Troubleshooting

If login issues persist after password reset:

1. Check if Supabase Authentication settings are correct in the environment variables
2. Verify that the Next.js API routes for authentication are working correctly
3. Try creating a new test user through the registration process

## Note

These credentials are for testing purposes only and should not be used in production.
