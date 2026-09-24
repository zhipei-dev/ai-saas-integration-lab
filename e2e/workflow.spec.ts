import { expect, test } from '@playwright/test';

test('creates, generates, approves, and shows the audit trail', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Subject').fill('Billing issue');
  await page.getByLabel('Customer email').fill('buyer@example.test');
  await page.getByLabel('Description').fill('Please help with a synthetic billing problem today.');
  await page.getByRole('button', { name: 'Create case' }).click();
  await page.getByRole('button', { name: 'Generate AI suggestion' }).click();
  await expect(page.getByRole('heading', { name: 'AI suggestion' })).toBeVisible();
  await page.getByRole('button', { name: 'Approve suggestion' }).click();
  await expect(page.getByTestId('case-status')).toHaveText('approved');
  await expect(page.getByLabel('Audit timeline')).toContainText('approval.approved');
});
