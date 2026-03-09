import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = 'http://localhost:3000';
const OUT  = __dirname;

const shots = [
  // [url, filename, scrollY, viewportHeight]
  { url: '/projects/siginspector.html', file: 'sig-hero.png',    scroll: 0,   h: 700 },
  { url: '/projects/siginspector.html', file: 'sig-visual.png',  scroll: 380, h: 420 },
  { url: '/projects/happening.html',    file: 'hap-hero.png',    scroll: 0,   h: 700 },
  { url: '/projects/happening.html',    file: 'hap-visual.png',  scroll: 380, h: 420 },
  { url: '/projects/framed.html',       file: 'fra-hero.png',    scroll: 0,   h: 700 },
  { url: '/projects/framed.html',       file: 'fra-visual.png',  scroll: 380, h: 420 },
  { url: '/projects/snoograph.html',    file: 'sno-hero.png',    scroll: 0,   h: 700 },
  { url: '/projects/snoograph.html',    file: 'sno-visual.png',  scroll: 380, h: 420 },
  // Full-page shots of each project
  { url: '/projects/siginspector.html', file: 'sig-full.png',    scroll: 0,   h: 900, full: true },
  { url: '/projects/happening.html',    file: 'hap-full.png',    scroll: 0,   h: 900, full: true },
  { url: '/projects/framed.html',       file: 'fra-full.png',    scroll: 0,   h: 900, full: true },
  { url: '/projects/snoograph.html',    file: 'sno-full.png',    scroll: 0,   h: 900, full: true },
];

const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: shot.h });
  await page.goto(BASE + shot.url, { waitUntil: 'networkidle' });
  // wait for animations to trigger
  await page.waitForTimeout(1400);
  if (shot.scroll) {
    await page.evaluate(y => window.scrollTo(0, y), shot.scroll);
    await page.waitForTimeout(700);
  }
  await page.screenshot({
    path: path.join(OUT, shot.file),
    fullPage: shot.full ?? false,
    clip: shot.full ? undefined : { x: 0, y: 0, width: 1280, height: shot.h },
  });
  console.log('✓', shot.file);
  await page.close();
}

await browser.close();
console.log('All screenshots done');
