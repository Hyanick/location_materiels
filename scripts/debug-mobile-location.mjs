import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'tmp', 'responsive-screenshots');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
});
const page = await context.newPage();

page.on('console', (message) => console.log(`console:${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => console.log(`pageerror:${error.message}`));

await page.goto('http://127.0.0.1:4200/location', { waitUntil: 'networkidle' });
await page.screenshot({ path: join(outputDir, 'debug-location-start.png'), fullPage: false });

await page.getByRole('button', { name: 'Aperçu PDF' }).last().click();
await page.waitForTimeout(5000);
await page.screenshot({ path: join(outputDir, 'debug-location-preview-click.png'), fullPage: false });

const dialogVisible = await page.locator('.pdf-preview-dialog').isVisible().catch(() => false);
const errorText = await page.locator('.pdf-preview-error').innerText().catch(() => '');
console.log(`dialogVisible=${dialogVisible}`);
console.log(`errorText=${errorText}`);

await page.keyboard.press('Escape').catch(() => undefined);
await page.goto('http://127.0.0.1:4200/location', { waitUntil: 'networkidle' });
await page.getByText('Matériel loué').first().scrollIntoViewIfNeeded();
await page.getByRole('button', { name: /Matériel loué/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(outputDir, 'debug-location-material.png'), fullPage: false });

await browser.close();
