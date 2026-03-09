import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;

const browser = await chromium.launch({ headless: true });

// ── SigInspector ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/siginspector', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'project-sig-1.png') });
  console.log('✓ project-sig-1.png');

  // Features: set viewport taller to capture section, then fullPage=false
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
  await page.waitForTimeout(800);
  // Take screenshot of what's visible at this scroll position
  await page.screenshot({ path: path.join(OUT, 'project-sig-2.png') });
  console.log('✓ project-sig-2.png');
  await ctx.close();
}

// ── Snoograph ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://snoograph.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, 'project-sno-1.png') });
  console.log('✓ project-sno-1.png');
  await ctx.close();
}

// ── Happening ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://happening.ae', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, 'project-hap-1.png') });
  console.log('✓ project-hap-1.png');
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'project-hap-2.png') });
  console.log('✓ project-hap-2.png');
  await ctx.close();
}

// ── Framed ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://framed-six.vercel.app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'project-fra-1.png') });
  console.log('✓ project-fra-1.png');
  await ctx.close();
}

await browser.close();
console.log('\nAll done.');
