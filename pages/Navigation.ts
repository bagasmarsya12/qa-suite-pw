import { expect, Page } from '@playwright/test';

export class Navigation {
  readonly root;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('navigation');
  }

  link(label: string) {
    return this.root.getByRole('link', { name: new RegExp(label, 'i') });
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
