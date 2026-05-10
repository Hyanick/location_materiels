import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4200';
const outputDir = join(process.cwd(), 'tmp', 'responsive-screenshots');

const cases = [
  { name: 'home-iphone-se', path: '/', width: 375, height: 667 },
  { name: 'home-android', path: '/', width: 412, height: 915 },
  { name: 'location-iphone-se', path: '/location', width: 375, height: 667 },
  { name: 'location-android', path: '/location', width: 412, height: 915 },
  { name: 'location-tablet', path: '/location', width: 768, height: 1024 }
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const item of cases) {
  await page.setViewportSize({ width: item.width, height: item.height });
  await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outputDir, `${item.name}.png`), fullPage: false });
  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    bodyText: document.body.innerText.slice(0, 300)
  }));
  console.log(`${item.name}: ${metrics.clientHeight}/${metrics.scrollHeight}`);
}

await browser.close();
