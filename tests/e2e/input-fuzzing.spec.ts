import { test, expect } from '../../fixtures/monitoring';
import { expectControlDisabled } from '../../utils/ui';

const fuzzValues = [
  '   ',
  'QA 😀 Gebäude 日本語 العربية',
  'QA_<script>alert(1)</script>_&<>"\'',
  'QA_' + 'x'.repeat(500),
  'line one\nline two\tline three',
];

test.describe('safe input fuzzing', () => {
  for (const value of fuzzValues) {
    test(`building title survives unusual input: ${JSON.stringify(value).slice(0, 48)}`, async ({ page, monitor }) => {
      await page.goto('/dashboard/category/building/create');
      const title = page.locator('input[placeholder="e.g. Building 1"]');
      await title.fill(value);
      const actual = await title.inputValue();
      if (!value.trim()) {
        expect(actual).toBe('');
      } else {
        expect(actual.length).toBeGreaterThan(0);
      }
      await expect(page.locator('body')).not.toBeEmpty();
      expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
    });
  }

  test('message composer keeps special text in fields without enabling Send', async ({ page, monitor }) => {
    await page.goto('/dashboard/message/create');
    await page.getByPlaceholder('Enter topic here...').fill('QA 😀 <script>alert(1)</script>');
    await page.getByPlaceholder('Write a message...').fill('line one\nline two\t日本語 العربية');
    await expectControlDisabled(page.getByRole('button', { name: 'Send', exact: true }));
    expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
  });
});
