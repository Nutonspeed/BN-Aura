import { test, expect } from '@playwright/test';
import { AuthPage } from '../utils/page-objects/auth-page';
import { DashboardPage } from '../utils/page-objects/dashboard-page';
import { TEST_USERS } from '../utils/test-data';

test.describe('Sales Pipeline & CRM Workflows', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Login as sales staff
    await authPage.goto();
    await authPage.login(TEST_USERS.sales_staff_1.email, TEST_USERS.sales_staff_1.password);
    await authPage.expectSuccessfulLogin();
  });

  test('Create new lead from Magic Scan results', async ({ page }) => {
    // Navigate to analysis and complete scan
    await page.goto('/th/sales/analysis');
    await page.fill('[data-testid="customer-name"]', 'New Lead Customer');
    await page.fill('[data-testid="customer-email"]', 'newlead@test.com');
    await page.fill('[data-testid="customer-phone"]', '0812345678');
    await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test-face-1.jpg');
    
    await page.click('[data-testid="start-analysis-btn"]');
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 45000 });
    
    // Convert analysis to lead
    await page.click('[data-testid="create-lead-btn"]');
    
    // Should navigate to lead details page
    await page.waitForURL(/\/sales\/leads\/[a-zA-Z0-9-]+/);
    
    // Verify lead information is populated from analysis
    await expect(page.locator('[data-testid="lead-name"]')).toHaveValue('New Lead Customer');
    await expect(page.locator('[data-testid="lead-email"]')).toHaveValue('newlead@test.com');
    await expect(page.locator('[data-testid="lead-phone"]')).toHaveValue('0812345678');
    
    // Check AI-generated lead score
    const leadScore = await page.locator('[data-testid="lead-score"]').textContent();
    expect(parseInt(leadScore || '0')).toBeGreaterThan(0);
    expect(parseInt(leadScore || '101')).toBeLessThanOrEqual(100);
    
    // Verify analysis data is attached
    await expect(page.locator('[data-testid="attached-analysis"]')).toBeVisible();
  });

  test('Lead scoring and priority assignment', async ({ page }) => {
    await page.goto('/th/sales/leads');
    
    // Create multiple test leads with different characteristics
    const leadData = [
      { name: 'High Value Lead', email: 'high@test.com', phone: '0811111111', budget: '50000+' },
      { name: 'Medium Lead', email: 'medium@test.com', phone: '0822222222', budget: '20000-50000' },
      { name: 'Budget Conscious', email: 'budget@test.com', phone: '0833333333', budget: '5000-20000' }
    ];
    
    for (const lead of leadData) {
      await page.click('[data-testid="create-lead-btn"]');
      await page.fill('[data-testid="lead-name"]', lead.name);
      await page.fill('[data-testid="lead-email"]', lead.email);
      await page.fill('[data-testid="lead-phone"]', lead.phone);
      await page.selectOption('[data-testid="budget-range"]', lead.budget);
      await page.click('[data-testid="save-lead-btn"]');
      await page.waitForSelector('[data-testid="lead-saved-message"]');
    }
    
    // Navigate back to leads list
    await page.goto('/th/sales/leads');
    
    // Verify leads are sorted by AI score (highest first)
    const leadScores = await page.locator('[data-testid="lead-score-value"]').allTextContents();
    const scores = leadScores.map(score => parseInt(score));
    
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
    
    // Check priority color coding
    await expect(page.locator('[data-testid="high-priority-lead"]').first()).toHaveClass(/bg-red|border-red/);
    await expect(page.locator('[data-testid="medium-priority-lead"]').first()).toHaveClass(/bg-yellow|border-yellow/);
    await expect(page.locator('[data-testid="low-priority-lead"]').first()).toHaveClass(/bg-green|border-green/);
  });

  test('Kanban board lead management', async ({ page }) => {
    await page.goto('/th/sales/leads');
    
    // Switch to Kanban view
    await page.click('[data-testid="kanban-view-btn"]');
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    
    // Verify kanban columns are present
    const expectedColumns = ['New Leads', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    for (const column of expectedColumns) {
      await expect(page.locator(`[data-testid="kanban-column"]`, { hasText: column })).toBeVisible();
    }
    
    // Create a test lead in 'New Leads' column
    await page.click('[data-testid="add-lead-to-column"][data-column="new"]');
    await page.fill('[data-testid="quick-lead-name"]', 'Kanban Test Lead');
    await page.fill('[data-testid="quick-lead-email"]', 'kanban@test.com');
    await page.click('[data-testid="quick-save-btn"]');
    
    // Verify lead appears in New Leads column
    await expect(page.locator('[data-testid="kanban-column"][data-column="new"]')
      .locator('[data-testid="lead-card"]', { hasText: 'Kanban Test Lead' })).toBeVisible();
    
    // Drag lead to 'Contacted' column
    const leadCard = page.locator('[data-testid="lead-card"]', { hasText: 'Kanban Test Lead' });
    const contactedColumn = page.locator('[data-testid="kanban-column"][data-column="contacted"]');
    
    await leadCard.dragTo(contactedColumn);
    
    // Verify lead moved to Contacted column
    await expect(contactedColumn.locator('[data-testid="lead-card"]', { hasText: 'Kanban Test Lead' })).toBeVisible();
    
    // Verify lead status updated
    await leadCard.click();
    await expect(page.locator('[data-testid="lead-status"]')).toHaveText('Contacted');
  });

  test('AI proposal generation workflow', async ({ page }) => {
    // Start from a qualified lead
    await page.goto('/th/sales/leads');
    await page.locator('[data-testid="lead-card"]').first().click();
    
    // Generate AI proposal
    await page.click('[data-testid="generate-proposal-btn"]');
    await page.waitForSelector('[data-testid="proposal-generator"]');
    
    // Select treatments based on analysis
    await page.check('[data-testid="treatment-checkbox"][value="acne-treatment"]');
    await page.check('[data-testid="treatment-checkbox"][value="brightening-facial"]');
    
    // Set proposal parameters
    await page.selectOption('[data-testid="package-duration"]', '6-months');
    await page.selectOption('[data-testid="discount-tier"]', '10-percent');
    
    // Generate proposal with AI
    await page.click('[data-testid="generate-ai-proposal-btn"]');
    await page.waitForSelector('[data-testid="ai-proposal-preview"]', { timeout: 30000 });
    
    // Verify AI-generated content
    await expect(page.locator('[data-testid="proposal-title"]')).toContainText('Personalized Treatment Plan');
    await expect(page.locator('[data-testid="proposal-treatments"]')).toContainText('Acne Treatment');
    await expect(page.locator('[data-testid="proposal-treatments"]')).toContainText('Brightening Facial');
    
    // Check pricing calculations
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent();
    expect(parseInt(totalPrice?.replace(/[^\d]/g, '') || '0')).toBeGreaterThan(0);
    
    // Save and send proposal
    await page.fill('[data-testid="proposal-notes"]', 'Customized based on skin analysis results');
    await page.click('[data-testid="save-proposal-btn"]');
    
    await expect(page.locator('[data-testid="proposal-saved-message"]')).toBeVisible();
    
    // Send via email
    await page.click('[data-testid="send-email-btn"]');
    await expect(page.locator('[data-testid="email-sent-message"]')).toBeVisible();
  });

  test('Customer communication and chat integration', async ({ page }) => {
    await page.goto('/th/sales/chat');
    
    // Verify chat center interface
    await expect(page.locator('[data-testid="chat-center"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-list"]')).toBeVisible();
    
    // Start conversation with customer
    await page.locator('[data-testid="customer-chat"]').first().click();
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
    
    // Send message
    const testMessage = 'สวัสดีค่ะ ขอบคุณที่สนใจบริการของเราค่ะ';
    await page.fill('[data-testid="chat-input"]', testMessage);
    await page.click('[data-testid="send-message-btn"]');
    
    // Verify message appears in chat
    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText(testMessage);
    
    // Test AI assistance for responses
    await page.click('[data-testid="ai-assist-btn"]');
    await page.selectOption('[data-testid="message-template"]', 'follow-up-analysis');
    
    const aiSuggestion = await page.locator('[data-testid="ai-suggestion"]').textContent();
    expect(aiSuggestion).toBeTruthy();
    expect(aiSuggestion).toContain('ผลการวิเคราะห์');
    
    // Use AI suggestion
    await page.click('[data-testid="use-suggestion-btn"]');
    await expect(page.locator('[data-testid="chat-input"]')).toHaveValue(aiSuggestion || '');
  });

  test('Commission tracking and sales analytics', async ({ page }) => {
    await page.goto('/th/sales');
    
    // Verify sales dashboard metrics
    await expect(page.locator('[data-testid="monthly-target"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="commission-earned"]')).toBeVisible();
    
    // Check commission calculation
    const commissionAmount = await page.locator('[data-testid="commission-amount"]').textContent();
    const salesAmount = await page.locator('[data-testid="total-sales"]').textContent();
    
    // Verify commission is calculated correctly (assuming 10% rate)
    const commission = parseInt(commissionAmount?.replace(/[^\d]/g, '') || '0');
    const sales = parseInt(salesAmount?.replace(/[^\d]/g, '') || '0');
    
    if (sales > 0) {
      expect(commission).toBe(Math.floor(sales * 0.1));
    }
    
    // Test performance charts
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversion-chart"]')).toBeVisible();
    
    // View detailed commission breakdown
    await page.click('[data-testid="view-commission-details"]');
    await expect(page.locator('[data-testid="commission-breakdown"]')).toBeVisible();
    
    // Verify individual transaction commissions
    const transactionRows = page.locator('[data-testid="commission-transaction"]');
    const count = await transactionRows.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const row = transactionRows.nth(i);
      await expect(row.locator('[data-testid="transaction-date"]')).toBeVisible();
      await expect(row.locator('[data-testid="transaction-amount"]')).toBeVisible();
      await expect(row.locator('[data-testid="commission-rate"]')).toBeVisible();
      await expect(row.locator('[data-testid="commission-amount"]')).toBeVisible();
    }
  });

  test('Follow-up automation and task management', async ({ page }) => {
    await page.goto('/th/sales/leads');
    
    // Select a lead for follow-up
    await page.locator('[data-testid="lead-card"]').first().click();
    
    // Set up automated follow-up
    await page.locator('[data-testid="schedule-followup-btn"]').first().click();
    await page.selectOption('[data-testid="followup-type"]', 'email');
    await page.selectOption('[data-testid="followup-timing"]', '3-days');
    await page.fill('[data-testid="followup-notes"]', 'Follow up on skin analysis and treatment options');
    
    await page.click('[data-testid="schedule-btn"]');
    await expect(page.locator('[data-testid="followup-scheduled-message"]')).toBeVisible();
    
    // Verify follow-up appears in tasks
    await page.goto('/th/sales/tasks');
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Follow up on skin analysis');
    
    // Complete a follow-up task
    await page.locator('[data-testid="complete-task-btn"]').first().click();
    await page.fill('[data-testid="task-completion-notes"]', 'Called customer, interested in package deal');
    await page.click('[data-testid="save-completion-btn"]');
    
    await expect(page.locator('[data-testid="task-completed-message"]')).toBeVisible();
    
    // Verify task marked as completed
    await expect(page.locator('[data-testid="completed-task"]').first()).toHaveClass(/completed|done/);
  });
});
