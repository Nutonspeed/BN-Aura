import { Page, Locator, expect } from '@playwright/test';
import { TEST_CONFIG } from '../test-data';

/**
 * Page Object for Authentication flows
 * Handles login, logout, and role-based authentication testing
 */
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly errorMessage: Locator;
  readonly userProfileMenu: Locator;
  readonly roleIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'name@clinic.com' });
    this.passwordInput = page.getByRole('textbox', { name: '••••••••' });
    this.loginButton = page.getByRole('button', { name: 'ลงชื่อเข้าใช้' });
    this.logoutButton = page.locator('button', { hasText: /ออกจากระบบ|Logout/i });
    this.errorMessage = page.locator('.text-red-500, .error-message, [role="alert"]');
    this.userProfileMenu = page.locator('[data-testid="user-profile-menu"], .user-menu, .profile-menu');
    this.roleIndicator = page.locator('[data-testid="user-role"], .user-role, .role-badge');
  }

  async goto() {
    await this.page.goto(`${TEST_CONFIG.baseURL}/th/login`);
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    // Handle PDPA modal if present
    try {
      const pdpaButton = this.page.getByRole('button', { name: 'Accept & Initialize Suite' });
      if (await pdpaButton.isVisible({ timeout: 2000 })) {
        await pdpaButton.click();
      }
    } catch (e) {
      // PDPA modal not present, continue
    }

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    
    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL(/\/(dashboard|admin|sales|beautician|customer)/, { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 })
    ]);
  }

  async logout() {
    await this.userProfileMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }

  async expectSuccessfulLogin(expectedRole?: string) {
    // Should be redirected to appropriate dashboard
    await expect(this.page).toHaveURL(/\/(dashboard|admin|sales|beautician|customer)/);
    
    if (expectedRole) {
      await expect(this.roleIndicator).toContainText(expectedRole);
    }
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectLoggedOut() {
    await expect(this.page).toHaveURL(/\/login/);
  }

  async getCurrentRole(): Promise<string> {
    await this.userProfileMenu.click();
    return await this.roleIndicator.textContent() || '';
  }
}
