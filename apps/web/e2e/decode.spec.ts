import { test, expect } from '@playwright/test';

// Critical-flow E2E: the anonymous decode path (no auth required).
test.describe('Anonymous decode flow', () => {
    test('home page loads and links to the decoder', async ({ page }) => {
        await page.goto('/');
        await expect(
            page.getByRole('heading', { name: /decode a string without knowing the format/i })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open the workspace' })).toBeVisible();
    });

    test('pasting an encoded string displays its decoded layers', async ({ page }) => {
        const input = 'SGVsbG8gV29ybGQ=';
        const decodeResult = {
            originalInput: input,
            steps: [
                {
                    decoderName: 'Base64',
                    confidence: 0.98,
                    input,
                    output: 'Hello World',
                    explanation: 'Decoded Base64 text.',
                },
            ],
            finalOutput: 'Hello World',
        };

        await page.route('**/api/decode', async (route) => {
            expect(route.request().method()).toBe('POST');
            expect(route.request().postDataJSON()).toEqual({ input });
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(decodeResult),
            });
        });

        await page.goto('/decode');

        await expect(page.getByRole('heading', { name: 'Workspace' })).toBeVisible();
        const inputField = page.getByRole('textbox', { name: 'Encoded input' });
        await expect(inputField).toBeVisible();

        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.evaluate(async (text) => navigator.clipboard.writeText(text), input);
        await inputField.click();
        await page.keyboard.press('ControlOrMeta+V');

        await expect(inputField).toHaveValue(input);
        const resultPane = page.getByRole('region', { name: 'Result' });
        await expect(resultPane.getByText('1 layer')).toBeVisible();
        await expect(resultPane.getByText('Base64')).toBeVisible();
        await expect(resultPane.locator('.ws-out-text')).toHaveText('Hello World');
    });
});
