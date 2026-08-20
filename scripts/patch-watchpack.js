#!/usr/bin/env node
/**
 * Silences the console spam:
 *
 *   Watchpack Error (stats): Error: EINVAL: invalid argument, lstat 'C:\pagefile.sys'
 *
 * WHY IT HAPPENS
 * Webpack's file watcher (watchpack) watches every watched directory *and its
 * ancestors*, so on Windows it ends up watching the drive root `C:\`. Windows
 * keeps `pagefile.sys` / `hiberfil.sys` / `swapfile.sys` / `DumpStack.log.tmp`
 * locked and constantly changing, so the watcher fires and then lstats them.
 *
 * From Node 22.17 onwards libuv returns EINVAL for those protected paths where
 * older Node returned EPERM/ENOENT — and watchpack only swallows the latter, so
 * every pagefile write prints an error. It is noise, not a build failure, but it
 * drowns real output during `ng serve` / `ng build --watch`.
 *
 * Upstream (watchpack #187) added an `EINVAL && IS_WIN` guard to the readdir and
 * _scanDirectory paths in 2.5.2 — but NOT to the `checkStats` lstat path, which
 * is the one that reaches `onStatsError` and prints this exact message. So
 * upgrading watchpack does not fix it; this patch adds the same guard there.
 *
 * THE REAL FIX is to run this project on a Node version Angular CLI 14 actually
 * supports (^14.20 || ^16.14 || ^18.10 — see .nvmrc and package.json engines).
 * On Node 18 libuv returns EPERM here and watchpack already handles it. This
 * patch exists so the error is gone on Node 22 too.
 *
 * Idempotent, and never fails the install: if watchpack is absent or its source
 * has changed shape, it says so and exits 0.
 */

const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'watchpack',
  'lib',
  'DirectoryWatcher.js',
);

// The guard as shipped by watchpack 2.5.1/2.5.2 in checkStats(). Matched
// whitespace-insensitively so a reformat upstream does not silently no-op.
const GUARD = /err\.code !== "ENOENT" &&(\s*)err\.code !== "EPERM" &&(\s*)err\.code !== "EBUSY"/;

const ALREADY = '!(err.code === "EINVAL" && IS_WIN)';

function main() {
  if (!fs.existsSync(TARGET)) {
    console.log('[patch-watchpack] watchpack not installed — nothing to do.');
    return;
  }

  const src = fs.readFileSync(TARGET, 'utf8');

  if (src.includes(ALREADY)) {
    console.log('[patch-watchpack] already patched.');
    return;
  }

  if (!GUARD.test(src)) {
    console.log(
      '[patch-watchpack] checkStats guard not found — watchpack changed shape. ' +
        'Skipping (harmless: you may see the pagefile.sys warning again).',
    );
    return;
  }

  // `IS_WIN` is already declared at module scope in DirectoryWatcher.js, so the
  // added condition needs no new import.
  const patched = src.replace(
    GUARD,
    (_m, ws1, ws2) =>
      `err.code !== "ENOENT" &&${ws1}err.code !== "EPERM" &&${ws2}err.code !== "EBUSY" &&${ws2}${ALREADY}`,
  );

  fs.writeFileSync(TARGET, patched, 'utf8');
  console.log('[patch-watchpack] patched checkStats to ignore EINVAL on Windows.');
}

try {
  main();
} catch (err) {
  // Never break `npm install` (or a Vercel build) over a console-noise fix.
  console.log(`[patch-watchpack] skipped: ${err && err.message}`);
}
