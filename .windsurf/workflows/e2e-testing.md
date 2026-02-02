---
description: Comprehensive E2E testing workflow using Playwright MCP
---

# E2E Testing Workflow

This workflow guides you through running comprehensive E2E tests using Playwright MCP.

## Prerequisites
- Development server running (http://localhost:3000)
- Test data prepared in database
- Playwright browsers installed

## Quick Start

### 1. Install Playwright Browser
```
Use Playwright MCP: browser_install
```

### 2. Navigate to Application
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000"
```

### 3. Take Initial Snapshot
```
Use Playwright MCP: browser_snapshot
- filename: "homepage.md"
```

## Testing Scenarios

### Authentication Flow Test

#### Step 1: Navigate to Login
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/th/login"
```

#### Step 2: Fill Login Form
```
Use Playwright MCP: browser_fill_form
- fields: [
    {name: "email", type: "textbox", value: "test@clinic.com"},
    {name: "password", type: "textbox", value: "password123"}
  ]
```

#### Step 3: Click Login Button
```
Use Playwright MCP: browser_click
- element: "Login button"
- ref: "[get from snapshot]"
```

#### Step 4: Wait for Dashboard
```
Use Playwright MCP: browser_wait_for
- text: "Dashboard"
```

#### Step 5: Verify Success
```
Use Playwright MCP: browser_snapshot
- filename: "dashboard-logged-in.md"
```

#### Step 6: Check Console for Errors
```
Use Playwright MCP: browser_console_messages
- level: "error"
```

### Workflow Creation Test

#### Step 1: Navigate to Sales Workflow
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/th/sales/workflow"
```

#### Step 2: Click New Lead Button
```
Use Playwright MCP: browser_click
- element: "New Lead button"
- ref: "[from snapshot]"
```

#### Step 3: Fill Customer Form
```
Use Playwright MCP: browser_fill_form
- fields: [
    {name: "customer_name", type: "textbox", value: "Test Customer"},
    {name: "phone", type: "textbox", value: "0812345678"},
    {name: "source", type: "combobox", value: "Walk-in"}
  ]
```

#### Step 4: Submit Form
```
Use Playwright MCP: browser_click
- element: "Create button"
- ref: "[from snapshot]"
```

#### Step 5: Verify Creation
```
Use Playwright MCP: browser_wait_for
- text: "Workflow created"

Use Playwright MCP: browser_snapshot
- filename: "workflow-created.md"
```

### Workflow Transition Test

#### Step 1: Drag Workflow Card
```
Use Playwright MCP: browser_drag
- startElement: "Lead card"
- startRef: "[from snapshot]"
- endElement: "Scanned column"
- endRef: "[from snapshot]"
```

#### Step 2: Wait for Update
```
Use Playwright MCP: browser_wait_for
- text: "Stage updated"
```

#### Step 3: Verify in Database
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT current_stage FROM workflow_states WHERE id = '[workflow-id]'"
```

### Magic Scan Test

#### Step 1: Navigate to Demo
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/th/demo"
```

#### Step 2: Upload Test Image
```
Use Playwright MCP: browser_file_upload
- paths: ["tests/fixtures/test-images/test-face-1.jpg"]
```

#### Step 3: Wait for AI Analysis
```
Use Playwright MCP: browser_wait_for
- time: 30
```

#### Step 4: Verify Results
```
Use Playwright MCP: browser_snapshot
- filename: "magic-scan-results.md"
```

#### Step 5: Take Screenshot
```
Use Playwright MCP: browser_take_screenshot
- filename: "magic-scan-complete.png"
- type: "png"
```

#### Step 6: Check Network Calls
```
Use Playwright MCP: browser_network_requests
- includeStatic: false
- filename: "network-log.txt"
```

### Commission Tracking Test

#### Step 1: Create Test Workflow with Payment
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "INSERT INTO workflow_states (clinic_id, customer_id, current_stage, assigned_sales_id) VALUES ('[clinic-id]', '[customer-id]', 'payment_confirmed', '[sales-id]') RETURNING id"
```

#### Step 2: Navigate to Commission Tracker
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/th/sales/commissions"
```

#### Step 3: Verify Commission Appears
```
Use Playwright MCP: browser_wait_for
- text: "[expected commission amount]"
```

#### Step 4: Check Database
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT * FROM sales_commissions WHERE sales_staff_id = '[sales-id]' ORDER BY created_at DESC LIMIT 1"
```

### Multi-tenant Isolation Test

#### Step 1: Login as Clinic A User
```
Use Playwright MCP: browser_fill_form
(login fields for Clinic A)
```

#### Step 2: Try to Access Clinic B URL
```
Use Playwright MCP: browser_navigate
- url: "http://localhost:3000/th/customers?clinic_id=[clinic-b-id]"
```

#### Step 3: Verify Access Denied
```
Use Playwright MCP: browser_snapshot
(should show error or redirect)
```

#### Step 4: Verify Database Isolation
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT COUNT(*) FROM customers WHERE clinic_id = '[clinic-b-id]'"
(should return 0 due to RLS)
```

## Performance Testing

### Measure Page Load Time
```
Use Playwright MCP: browser_navigate
- url: "[url]"

Use Playwright MCP: browser_evaluate
- function: "() => { return { loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart, domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart } }"
```

## Debugging Failed Tests

### Step 1: Check Console Errors
```
Use Playwright MCP: browser_console_messages
- level: "error"
```

### Step 2: Check Network Failures
```
Use Playwright MCP: browser_network_requests
- includeStatic: false
```

### Step 3: Take Screenshot
```
Use Playwright MCP: browser_take_screenshot
- filename: "error-state.png"
```

### Step 4: Take Full Page Snapshot
```
Use Playwright MCP: browser_snapshot
- filename: "error-snapshot.md"
```

### Step 5: Check Database State
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "SELECT * FROM [relevant_table] WHERE id = '[id]'"
```

## Test Cleanup

### Clear Test Data
```
Use Supabase MCP: execute_sql
- project_id: "[project-id]"
- query: "DELETE FROM workflow_states WHERE customer_id IN (SELECT id FROM customers WHERE full_name LIKE 'Test%')"
```

### Close Browser
```
Use Playwright MCP: browser_close
```

## Test Report Checklist
- [ ] All authentication scenarios passed
- [ ] Workflow creation working
- [ ] Workflow transitions working
- [ ] Commission calculation correct
- [ ] Magic Scan functional
- [ ] Multi-tenant isolation verified
- [ ] Performance within targets
- [ ] No console errors
- [ ] No network failures
- [ ] Screenshots captured
