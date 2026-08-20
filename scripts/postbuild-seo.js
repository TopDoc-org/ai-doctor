#!/usr/bin/env node
/**
 * Post-build SEO step. Runs after `ng run AIDoctorFront:prerender`.
 *
 * 1. Generates sitemap.xml from the routes that were actually prerendered, so the
 *    sitemap can never drift from what is deployed. The previous sitemap was a
 *    hand-maintained file with hardcoded lastmod dates.
 * 2. Copies the prerendered /404 page to 404.html at the output root, which is
 *    where static hosts (Vercel included) look for a custom 404 to serve with a
 *    real 404 status.
 *
 * No dependencies beyond Node's standard library.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_URL = 'https://doctoguide.knocdoc.in';
const OUT_DIR = path.resolve(__dirname, '..', 'dist', 'AIDoctorFront', 'browser');

/**
 * Routes that must never appear in the sitemap, even if prerendered.
 * `/start` is the Google Ads landing page: prerendered so AdsBot sees real
 * HTML, but noindex and never submitted for organic indexing.
 */
const EXCLUDED = new Set(['/404', '/start']);

/** Priority by route. Anything unlisted falls back to DEFAULT_PRIORITY. */
const PRIORITY = {
  '/': '1.0',
  '/privacy': '0.3',
  '/terms': '0.3',
  '/disclaimer': '0.4',
  '/contact': '0.5',
  '/health-topics': '0.7',
};
const DEFAULT_PRIORITY = '0.8';

const CHANGEFREQ = {
  '/': 'weekly',
  '/privacy': 'yearly',
  '/terms': 'yearly',
  '/disclaimer': 'yearly',
};
const DEFAULT_CHANGEFREQ = 'monthly';

/**
 * A single date for every URL, taken from the last commit. Honest ("the site was
 * last changed then") and stable across rebuilds — stamping today's date on every
 * URL each deploy would tell Google everything changed when nothing did.
 */
function lastModified() {
  try {
    const iso = execSync('git log -1 --format=%cI', {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (iso) return iso.slice(0, 10);
  } catch {
    // Not a git checkout (or git unavailable) — fall through to today.
  }
  return new Date().toISOString().slice(0, 10);
}

/** Every prerendered route, derived from the index.html files on disk. */
function collectRoutes(dir, base = '') {
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'assets') continue;

    const childDir = path.join(dir, entry.name);
    const childRoute = `${base}/${entry.name}`;

    if (fs.existsSync(path.join(childDir, 'index.html'))) {
      routes.push(childRoute);
    }
    routes.push(...collectRoutes(childDir, childRoute));
  }
  return routes;
}

function buildSitemap(routes, lastmod) {
  const urls = routes
    .map((route) => {
      const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
      const priority = PRIORITY[route] || DEFAULT_PRIORITY;
      const changefreq = CHANGEFREQ[route] || DEFAULT_CHANGEFREQ;
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`[postbuild-seo] Output directory not found: ${OUT_DIR}`);
    process.exit(1);
  }

  // --- sitemap ---------------------------------------------------------------
  const routes = ['/', ...collectRoutes(OUT_DIR)]
    .filter((r) => !EXCLUDED.has(r))
    .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

  const lastmod = lastModified();
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), buildSitemap(routes, lastmod), 'utf8');
  console.log(`[postbuild-seo] sitemap.xml written with ${routes.length} URLs (lastmod ${lastmod}).`);

  // --- 404 -------------------------------------------------------------------
  const prerendered404 = path.join(OUT_DIR, '404', 'index.html');
  if (fs.existsSync(prerendered404)) {
    fs.copyFileSync(prerendered404, path.join(OUT_DIR, '404.html'));
    console.log('[postbuild-seo] 404.html written from the prerendered /404 route.');
  } else {
    console.warn('[postbuild-seo] No prerendered /404 route found — 404.html not written.');
  }

  // --- strip build leftovers -------------------------------------------------
  // Angular's font inliner writes the pre-inlining page to index.original.html
  // and leaves it in the output. Deployed, that is a crawlable HTTP 200 duplicate
  // of the homepage carrying stale markup — exactly the kind of duplicate URL the
  // canonical work here exists to eliminate.
  for (const leftover of ['index.original.html']) {
    const file = path.join(OUT_DIR, leftover);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`[postbuild-seo] removed build leftover ${leftover}.`);
    }
  }

  // --- sanity check ----------------------------------------------------------
  // A prerender that silently produced empty shells is the exact failure this
  // whole pipeline exists to prevent, so fail the build rather than deploy it.
  const home = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8');
  if (!/<h1[\s>]/.test(home)) {
    console.error('[postbuild-seo] FAIL: prerendered homepage contains no <h1>. Prerender did not run correctly.');
    process.exit(1);
  }
  console.log('[postbuild-seo] Prerender sanity check passed (homepage has an <h1>).');
}

main();
