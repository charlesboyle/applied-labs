import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;

const projects = [
  {
    name: 'siginspector',
    url: 'http://localhost:3000/siginspector',
    wait: 2500,
    shots: [
      { file: 'project-sig-1.png', scroll: 0,    h: 820 },
      { file: 'project-sig-2.png', scroll: 700,  h: 700 },
    ],
  },
  {
    name: 'framed',
    url: 'https://framed-six.vercel.app/',
    wait: 3000,
    shots: [
      { file: 'project-fra-1.png', scroll: 0,    h: 820 },
      { file: 'project-fra-2.png', scroll: 700,  h: 700 },
    ],
  },
  {
    name: 'snoograph',
    url: 'https://snoograph.com',
    wait: 3500,
    shots: [
      { file: 'project-sno-1.png', scroll: 0,    h: 820 },
      { file: 'project-sno-2.png', scroll: 700,  h: 700 },
    ],
  },
  {
    name: 'happening',
    url: 'https://happening.ae',
    wait: 4000,
    shots: [
      { file: 'project-hap-1.png', scroll: 0,    h: 820 },
      { file: 'project-hap-2.png', scroll: 700,  h: 700 },
    ],
  },
];

const browser = await chromium.launch({ headless: true });

for (const proj of projects) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();

  console.log(`→ ${proj.name}: ${proj.url}`);
  try {
    await page.goto(proj.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(proj.wait);

    for (const shot of proj.shots) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), shot.scroll);
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(OUT, shot.file),
        clip: { x: 0, y: shot.scroll, width: 1280, height: shot.h },
      });
      console.log('  ✓', shot.file);
    }
  } catch (e) {
    console.error(`  ✗ ${proj.name}:`, e.message);
  }
  await ctx.close();
}

await browser.close();
console.log('\nDone.');
