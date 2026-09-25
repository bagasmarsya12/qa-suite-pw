import { expect, Page } from '@playwright/test';

export class LoginPage {
  readonly email;
  readonly password;
  readonly signIn;

  constructor(private readonly page: Page) {
    this.email = page.locator('input[type="email"]');
    this.password = page.locator('input[type="password"]');
    this.signIn = page.getByRole('button', { name: /^Sign In$/i });
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.email).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.signIn).toBeVisible();
  }

  async signInAs(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.signIn.click();
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
