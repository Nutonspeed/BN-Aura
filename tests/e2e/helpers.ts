import { Page } from '@playwright/test';

/**
 * Bypass the PDPA consent modal by setting localStorage, then reloading.
 */
export async function bypassPDPA(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('pdpa_agreed', 'true');
    localStorage.setItem('pdpa_timestamp', new Date().toISOString());
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Login helper — navigates to login, bypasses PDPA, fills credentials, submits
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/th/login');
  await bypassPDPA(page);
  await page.getByRole('textbox', { name: 'name@clinic.com' }).fill(email);
  await page.getByRole('textbox', { name: '••••••••' }).fill(password);
  await page.getByRole('button', { name: 'ลงชื่อเข้าใช้' }).click();
}
