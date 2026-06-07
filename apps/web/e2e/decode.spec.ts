import { test, expect } from '@playwright/test';

// Critical-flow E2E: the anonymous decode path (no auth required).
test.describe('Anonymous decode flow', () => {
    test('home page loads and links to the decoder', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1.home-title')).toBeVisible();
        await expect(page.getByRole('link', { name: /decode/i }).first()).toBeVisible();
    });

    test('decodes a Base64 string end-to-end', async ({ page }) => {
        await page.goto('/decode');

        await expect(page.getByRole('heading', { name: /inspect encoded input/i })).toBeVisible();

        await page.getByPlaceholder('Enter encoded text here...').fill('SGVsbG8gV29ybGQ=');
        await page
            .getByRole('button', { name: /decode/i })
            .first()
            .click();

        // The pipeline should resolve to the decoded plaintext.
        await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 15_000 });
    });
});
