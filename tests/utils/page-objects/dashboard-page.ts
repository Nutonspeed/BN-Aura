import { Page, Locator, expect } from '@playwright/test';
import { TEST_CONFIG } from '../test-data';

/**
 * Page Object for Dashboard functionality
 * Handles navigation and common dashboard actions across different user roles
 */
export class DashboardPage {
  readonly page: Page;
  readonly sidebarMenu: Locator;
  readonly navigationLinks: Locator;
  readonly pageTitle: Locator;
  readonly userProfileMenu: Locator;
  readonly notificationsBell: Locator;
  readonly clinicSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
    this.navigationLinks = page.locator('[data-testid="nav-link"]');
    this.pageTitle = page.locator('h1, [data-testid="page-title"]');
    this.userProfileMenu = page.locator('[data-testid="user-profile-menu"]');
    this.notificationsBell = page.locator('[data-testid="notifications"]');
    this.clinicSelector = page.locator('[data-testid="clinic-selector"]');
  }

  async navigateTo(section: string) {
    await this.navigationLinks.filter({ hasText: new RegExp(section, 'i') }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageTitle(title: string) {
    await expect(this.pageTitle).toContainText(title);
  }

  async expectNavigationVisible(items: string[]) {
    for (const item of items) {
      await expect(this.navigationLinks.filter({ hasText: new RegExp(item, 'i') })).toBeVisible();
    }
  }

  async expectNavigationHidden(items: string[]) {
    for (const item of items) {
      await expect(this.navigationLinks.filter({ hasText: new RegExp(item, 'i') })).not.toBeVisible();
    }
  }

  async selectClinic(clinicName: string) {
    await this.clinicSelector.click();
    await this.page.locator(`[data-testid="clinic-option"]`, { hasText: clinicName }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getNotificationCount(): Promise<number> {
    const badge = this.page.locator('[data-testid="notification-badge"]');
    if (await badge.isVisible()) {
      const count = await badge.textContent();
      return parseInt(count || '0');
    }
    return 0;
  }
}
