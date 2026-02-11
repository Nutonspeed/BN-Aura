import { test, expect } from '@playwright/test';

test.describe('BN-Aura API Tests', () => {
  let authToken: string;
  let clinicId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'clinic.owner@bntest.com',
        password: 'BNAura2024!'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    clinicId = loginData.user.clinic_id;
  });

  test('Payments API - Record Payment', async ({ request }) => {
    const paymentData = {
      transaction_id: `test-${Date.now()}`,
      amount: 1500,
      payment_method: 'CARD',
      customer_id: null,
      clinic_id: clinicId,
      items: [{
        id: 'test-item',
        item_name: 'Test Treatment',
        quantity: 1,
        unit_price: 1500,
        total: 1500
      }],
      metadata: {
        test_payment: true,
        timestamp: new Date().toISOString()
      }
    };

    const response = await request.post('/api/payments', {
      data: paymentData,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.payment).toBeDefined();
    expect(result.data.payment.amount).toBe(1500);
  });

  test('Payments API - Get Payment History', async ({ request }) => {
    const response = await request.get('/api/payments', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.payments)).toBe(true);
  });

  test('Finance Reports API - Revenue Report', async ({ request }) => {
    const response = await request.get('/api/finance/reports/revenue', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.summary).toBeDefined();
    expect(typeof result.data.summary.totalRevenue).toBe('number');
  });

  test('Finance Expenses API - Create Expense', async ({ request }) => {
    const expenseData = {
      category: 'supplies',
      description: 'Test office supplies',
      amount: 500,
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH'
    };

    const response = await request.post('/api/finance/expenses', {
      data: expenseData,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.expense.category).toBe('supplies');
  });

  test('Finance Expenses API - Get Expenses', async ({ request }) => {
    const response = await request.get('/api/finance/expenses', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.expenses).toBeDefined();
    expect(result.data.summary).toBeDefined();
  });

  test('Business Intelligence API', async ({ request }) => {
    const response = await request.get('/api/analytics/advanced/business-intelligence', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.customerAnalytics).toBeDefined();
    expect(result.data.revenueAnalytics).toBeDefined();
    expect(result.data.staffPerformance).toBeDefined();
  });

  test('Payment Reconciliation API', async ({ request }) => {
    const response = await request.get('/api/payments/reconciliation', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.summary).toBeDefined();
    expect(result.data.payments).toBeDefined();
  });

  test('Customers API - Create Customer', async ({ request }) => {
    const customerData = {
      full_name: 'Test API Customer',
      phone: '0812345678',
      email: `test-${Date.now()}@example.com`,
      assigned_sales_id: null
    };

    const response = await request.post('/api/customers', {
      data: customerData,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.customer.full_name).toBe('Test API Customer');
  });

  test('Customers API - Get Customers', async ({ request }) => {
    const response = await request.get('/api/customers', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.customers)).toBe(true);
  });

  test('Products API', async ({ request }) => {
    const response = await request.get('/api/products', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.products)).toBe(true);
  });

  test('Treatments API', async ({ request }) => {
    const response = await request.get('/api/treatments', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.treatments)).toBe(true);
  });

  test('Staff API - Get Clinic Staff', async ({ request }) => {
    const response = await request.get('/api/staff', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.staff)).toBe(true);
  });
});
