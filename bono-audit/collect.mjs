#!/usr/bin/env node
/**
 * Evidence collector for the Bono audit.
 *
 * Loads each target in a real browser, measures it, screenshots it, and writes
 * evidence/evidence.json. The audit page renders whatever this produces — and
 * shows a "not collected" state when it hasn't run, so the page can never
 * display a finding that wasn't measured.
 *
 *   npm install playwright && npx playwright install chromium
 *   node collect.mjs
 *   node collect.mjs --new https://your-preview.vercel.app
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const NEW_BASE = arg('--new', 'http://localhost:8000');
const OUT = path.resolve('evidence');

const TARGETS = [
  { id: 'current-es', label: 'bono.eco · ES', side: 'current', url: 'https://www.bono.eco/es' },
  { id: 'current-en', label: 'bono.eco · EN', side: 'current', url: 'https://www.bono.eco/' },
  { id: 'new-es',     label: 'Redesign · ES', side: 'new',     url: `${NEW_BASE}/es/` },
  { id: 'new-en',     label: 'Redesign · EN', side: 'new',     url: `${NEW_BASE}/` }
];

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/* ------------------------------------------------------------------ */
/* In-page measurement. Runs in the browser, returns plain JSON.        */
/* ------------------------------------------------------------------ */

const measureInPage = () => {
  const rgb = (s) => {
    const m = (s || '').match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const effectiveBg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = rgb(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    const c = rgb(getComputedStyle(document.body).backgroundColor);
    return c && c.a > 0.5 ? c : { r: 255, g: 255, b: 255, a: 1 };
  };

  const cw = document.documentElement.clientWidth;

  /* Elements painting outside the viewport with no scroll container above
     them — i.e. content the visitor genuinely cannot reach. */
  const clipped = [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (r.right <= cw + 2) return false;
    if (!el.textContent || !el.textContent.trim()) return false;
    let a = el.parentElement;
    while (a && a !== document.body) {
      const ox = getComputedStyle(a).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return false;
      a = a.parentElement;
    }
    return true;
  }).slice(0, 12).map((el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.className.baseVal ?? el.className).toString().slice(0, 48),
    text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 70),
    right: Math.round(el.getBoundingClientRect().right),
    overflowBy: Math.round(el.getBoundingClientRect().right - cw)
  }));

  const textNodes = [...document.querySelectorAll('p,li,a,span,h1,h2,h3,h4,td,th,label,button')]
    .filter((el) => el.textContent.trim().length > 3 && el.offsetParent !== null)
    .slice(0, 400);

  const lowContrast = [];
  for (const el of textNodes) {
    const cs = getComputedStyle(el);
    const fg = rgb(cs.color);
    if (!fg || fg.a < 0.5) continue;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const r = ratio(fg, effectiveBg(el));
    if (r < need) {
      lowContrast.push({
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50),
        ratio: Math.round(r * 100) / 100,
        need,
        size: Math.round(size)
      });
    }
  }

  const imgs = [...document.images];
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => +h.tagName[1]);
  let headingJumps = 0;
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) headingJumps++;

  const namelessControls = [...document.querySelectorAll('a,button')].filter((el) => {
    if (el.getAttribute('aria-hidden') === 'true') return false;
    const name = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title');
    return !name;
  }).length;

  return {
    title: document.title,
    titleLength: document.title.length,
    metaDescription: (document.querySelector('meta[name="description"]')?.content || '').trim(),
    lang: document.documentElement.lang || null,
    hasCanonical: !!document.querySelector('link[rel="canonical"]'),
    hreflangCount: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().replace(/\s+/g, ' ').slice(0, 90)),
    headingJumps,
    wordCount: (document.body.innerText || '').trim().split(/\s+/).length,
    images: {
      total: imgs.length,
      missingAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
      emptyAltDecorative: imgs.filter((i) => i.getAttribute('alt') === '').length,
      oversized: imgs.filter((i) => i.naturalWidth > i.clientWidth * 2 && i.clientWidth > 0).length
    },
    namelessControls,
    clipped,
    lowContrast: lowContrast.slice(0, 15),
    lowContrastCount: lowContrast.length,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: cw,
    horizontalScroll: document.documentElement.scrollWidth > cw + 1
  };
};

/* ------------------------------------------------------------------ */

async function visit(browser, target, viewport, label) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const net = { requests: 0, bytes: 0, hosts: new Set(), fonts: 0, imageBytes: 0, imageCount: 0, failed: [] };
  page.on('response', async (res) => {
    try {
      const url = new URL(res.url());
      net.requests++;
      net.hosts.add(url.host);
      const type = res.request().resourceType();
      const len = parseInt(res.headers()['content-length'] || '0', 10);
      net.bytes += len;
      if (type === 'font') net.fonts++;
      if (type === 'image') { net.imageCount++; net.imageBytes += len; }
    } catch { /* opaque response */ }
  });
  page.on('requestfailed', (r) => net.failed.push(r.url().slice(0, 120)));

  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e.message).slice(0, 160)));

  let status = null, finalUrl = null, error = null;
  const t0 = Date.now();
  try {
    const res = await page.goto(target.url, { waitUntil: 'load', timeout: 45000 });
    status = res?.status() ?? null;
    finalUrl = page.url();
    await page.waitForTimeout(2500);
  } catch (e) {
    error = String(e.message).split('\n')[0].slice(0, 200);
  }
  const loadMs = Date.now() - t0;

  let vitals = {};
  let measured = {};
  if (!error) {
    vitals = await page.evaluate(() => new Promise((resolve) => {
      const out = { lcp: null, cls: 0, ttfb: null };
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) out.ttfb = Math.round(nav.responseStart);
      try {
        new PerformanceObserver((l) => {
          const e = l.getEntries();
          out.lcp = Math.round(e[e.length - 1].startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      } catch { /* unsupported */ }
      setTimeout(() => { out.cls = Math.round(out.cls * 1000) / 1000; resolve(out); }, 900);
    }));
    measured = await page.evaluate(measureInPage);

    const shot = path.join(OUT, `${target.id}-${label}.png`);
    await page.screenshot({ path: shot, fullPage: label === 'desktop' });
  }

  await ctx.close();

  return {
    viewport: label,
    status, finalUrl, error, loadMs,
    network: {
      requests: net.requests,
      bytes: net.bytes,
      hosts: net.hosts.size,
      thirdParty: [...net.hosts].filter((h) => !h.includes('bono.eco') && !h.includes('localhost')).length,
      fonts: net.fonts,
      imageCount: net.imageCount,
      imageBytes: net.imageBytes,
      failed: net.failed.slice(0, 6)
    },
    consoleErrors: consoleErrors.slice(0, 6),
    vitals,
    ...measured
  };
}

/* ------------------------------------------------------------------ */
/* Findings are derived only from measurements that crossed a threshold. */
/* ------------------------------------------------------------------ */

function deriveFindings(target, desktop, mobile) {
  const f = [];
  const add = (severity, title, evidence) => f.push({ severity, title, evidence });

  if (desktop.error) {
    add('blocker', 'Page failed to load', desktop.error);
    return f;
  }
  if (desktop.status && desktop.status >= 400) {
    add('blocker', `HTTP ${desktop.status}`, `${target.url} returned ${desktop.status}`);
  }

  if (mobile.horizontalScroll) {
    add('critical', 'Page scrolls horizontally on mobile',
      `Document is ${mobile.scrollWidth}px wide in a ${mobile.clientWidth}px viewport (${mobile.scrollWidth - mobile.clientWidth}px overflow).`);
  }
  if (mobile.clipped?.length) {
    const worst = mobile.clipped[0];
    add('critical', `${mobile.clipped.length} element(s) render outside the mobile viewport`,
      `Worst: <${worst.tag}> "${worst.text}" extends ${worst.overflowBy}px past the right edge with no scroll container — this content cannot be read.`);
  }

  const lcp = desktop.vitals?.lcp;
  if (lcp && lcp > 4000) add('high', 'Largest Contentful Paint is poor', `LCP ${lcp}ms on desktop (Google's "poor" threshold is 4000ms).`);
  else if (lcp && lcp > 2500) add('medium', 'Largest Contentful Paint needs improvement', `LCP ${lcp}ms on desktop (target is under 2500ms).`);

  if (desktop.vitals?.cls > 0.1) add('high', 'Layout shifts during load', `CLS ${desktop.vitals.cls} (target is under 0.1).`);

  const mb = desktop.network.bytes / 1024 / 1024;
  if (mb > 3) add('high', 'Page weight is heavy', `${mb.toFixed(1)} MB across ${desktop.network.requests} requests.`);
  else if (mb > 1.5) add('medium', 'Page weight is above budget', `${mb.toFixed(1)} MB across ${desktop.network.requests} requests.`);

  if (desktop.network.imageBytes / 1024 / 1024 > 1) {
    add('medium', 'Images dominate page weight',
      `${(desktop.network.imageBytes / 1024 / 1024).toFixed(1)} MB of images across ${desktop.network.imageCount} files.`);
  }
  if (desktop.network.fonts > 4) add('low', 'Many webfont files', `${desktop.network.fonts} font requests.`);
  if (desktop.network.thirdParty > 8) add('medium', 'Many third-party hosts', `${desktop.network.thirdParty} distinct third-party origins.`);
  if (desktop.network.failed?.length) add('medium', 'Requests failed', desktop.network.failed.join(' · '));
  if (desktop.consoleErrors?.length) add('medium', 'JavaScript errors on load', desktop.consoleErrors.join(' · '));

  if (desktop.images?.missingAlt) add('high', 'Images without alt attributes', `${desktop.images.missingAlt} of ${desktop.images.total} images.`);
  if (desktop.namelessControls) add('high', 'Links or buttons with no accessible name', `${desktop.namelessControls} control(s).`);
  if (desktop.lowContrastCount) {
    const w = desktop.lowContrast[0];
    add('high', `${desktop.lowContrastCount} text element(s) below WCAG AA contrast`,
      `Worst measured: "${w.text}" at ${w.ratio}:1, needs ${w.need}:1.`);
  }
  if (desktop.headingJumps) add('medium', 'Heading levels skip', `${desktop.headingJumps} jump(s) of more than one level.`);
  if ((desktop.h1?.length ?? 0) !== 1) add('medium', 'Page does not have exactly one H1', `Found ${desktop.h1?.length ?? 0}.`);
  if (!desktop.lang) add('medium', 'No lang attribute on <html>', 'Screen readers cannot pick a pronunciation.');
  if (!desktop.metaDescription) add('medium', 'No meta description', 'Search engines will synthesise one.');
  else if (desktop.metaDescription.length > 165) add('low', 'Meta description will be truncated', `${desktop.metaDescription.length} characters.`);
  if (!desktop.hasCanonical) add('low', 'No canonical URL', 'Duplicate-content risk across locales.');
  if (!desktop.hreflangCount) add('medium', 'No hreflang annotations', 'The ES and EN versions are not declared as alternates.');

  return f;
}

/* ------------------------------------------------------------------ */

(async () => {
  await mkdir(OUT, { recursive: true });
  /* CHROMIUM_PATH lets you point at a browser Playwright didn't install
     itself — useful on machines that already ship one. */
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const results = [];

  for (const target of TARGETS) {
    process.stdout.write(`→ ${target.label} … `);
    const desktop = await visit(browser, target, DESKTOP, 'desktop');
    const mobile = await visit(browser, target, MOBILE, 'mobile');
    const findings = deriveFindings(target, desktop, mobile);
    results.push({ ...target, desktop, mobile, findings });
    console.log(desktop.error ? `FAILED (${desktop.error})` : `ok · ${findings.length} finding(s)`);
  }

  const payload = {
    collectedAt: new Date().toISOString(),
    newBase: NEW_BASE,
    userAgent: await browser.version(),
    targets: results
  };

  await writeFile(path.join(OUT, 'evidence.json'), JSON.stringify(payload, null, 2));
  await browser.close();

  console.log(`\nWrote evidence/evidence.json and ${results.filter(r => !r.desktop.error).length * 2} screenshots.`);
  console.log('Open index.html (or deploy) to see the audit rendered.');
})();
