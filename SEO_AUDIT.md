# SEO Audit — DoctoGuide (doctoguide.knocdoc.in)

**Date:** 14 August 2026
**Branch:** V1-DEV
**Production:** https://doctoguide.knocdoc.in/ (Vercel, region `bom1`)
**Method:** live Google SERP queries in-browser, direct HTTP requests to production (including with a Googlebot user-agent), and a full read of the repository.

---

## 0. Headline finding

**The site had zero pages in Google's index.**

```
Query: site:doctoguide.knocdoc.in
Result: "Your search - site:doctoguide.knocdoc.in - did not match any documents."
```

This is not a ranking problem. There was nothing to rank. Meanwhile:

```
Query: site:knocdoc.in
Result: 10+ results — knocdoc.in, zenamaze.knocdoc.in, doctribe.knocdoc.in,
        amnesia.knocdoc.in, doctor.knocdoc.in, /privacy-policy, /terms-of-service
```

Four sibling subdomains on the same registrable domain and the same host **are** indexed. The domain has no penalty and no reputation problem. The failure was specific to this deployment.

### The control experiment

| Site | Words in raw HTML (no JS) | `<h1>` before JS | Indexed |
|---|---:|---|---|
| knocdoc.in | 1,800 | yes | yes |
| zenamaze.knocdoc.in | 565 | yes | yes |
| **doctoguide.knocdoc.in** | **110** | **none** | **no** |

The 110 words were the `<title>`, meta description, and JSON-LD strings. The `<body>` was literally `<app-root></app-root>`. Confirmed while spoofing Googlebot — identical 31,189-byte response, no server-side rendering, no special treatment.

Google can execute JavaScript, but rendering is a deferred second pass against a budget. A brand-new subdomain with no inbound links that returns an empty shell on first fetch is exactly the profile that never earns that budget.

### Brand query today

`DoctoGuide` returns page after page of YouTube and Instagram results — the official channel, `knocdoc_health`, plus reposts from `jaagruk_bharat`, `ujalacygnus`, and `doctar.in`. The website appears nowhere. Every one of those links is on a platform that marks outbound links `nofollow`, so none of them constituted a crawl path.

Confirmed separately: **knocdoc.in contains no links to any KnocDoc subdomain**, so there was no internal crawl path either.

---

## 1. Findings by severity

### CRITICAL

#### C1 — Production shipped the client-side build; every public page was an empty shell
**Files:** `package.json:7`, `angular.json:17-40`
**Was:** `"build": "ng build"` — the browser-only builder. A complete Angular Universal setup already existed (`server.ts`, `src/main.server.ts`, `src/app/app.server.module.ts`, and a `prerender` target in `angular.json` listing 12 routes) and was never invoked by any build or deploy path. No `vercel.json` or CI config existed to override it.
**Why it matters:** Crawlers received `<app-root></app-root>`. Every piece of SEO work in the repo — per-route titles, canonicals, FAQ schema — existed only after JavaScript executed. This is the direct cause of the index blackout.
**Fixed:** build now runs the prerender target; all 21 routes emit real HTML. See implementation report §1.

#### C2 — No discovery path existed
**Files:** `src/index.html` (no verification tag), and outside this repo
**Was:** No `google-site-verification` meta or file anywhere. No crawlable inbound links (all brand mentions are on `nofollow` social platforms). No link from knocdoc.in. `robots.txt` and `sitemap.xml` were live and correct but had never been read by anything.
**Why it matters:** Google had no reason to fetch the URL even once.
**Fixed:** partially — a Search Console URL-prefix property has been started and its verification file (`src/google16bbce61b7e4713d.html`) is committed and deploys to the site root. **Verification still requires a deploy, and linking from knocdoc.in remains outstanding.** See implementation report §G.

#### C3 — Every URL declared the homepage as its canonical
**File:** `src/index.html:13`
**Was:** `<link rel="canonical" href="https://doctoguide.knocdoc.in/">` hardcoded, and that file served verbatim for all 12 routes. Verified live:

```
/ai-doctor               -> 200, title "AI Doctor & Free Symptom Checker...", canonical .../
/symptom-checker         -> 200, identical title, canonical .../
/which-specialist-to-see -> 200, identical title, canonical .../
/health-guide /how-it-works /find-doctors /pricing /emergency-numbers -> all identical
```

**Why it matters:** 11 of 12 pages instructed Google to fold them into the homepage. `SeoService` corrected this after JS ran, but that depended on a render budget the site was not earning.
**Fixed:** prerendering writes the correct per-route canonical into each file. Now enforced by an automated check.

---

### HIGH

#### H1 — Unlimited soft-404s
**File:** `src/app/app-routing.module.ts` (wildcard route)
**Was:** `{ path: '**', redirectTo: '' }`. Confirmed live: `/this-page-does-not-exist-xyz123` returned **HTTP 200** with full homepage content.
**Why it matters:** An infinite URL space resolving to duplicate homepage content, wasting crawl budget on a site that had none to spare. Google reports these as "Soft 404".
**Fixed:** real `NotFoundComponent` (noindex), prerendered and emitted as `404.html` at the output root; `vercel.json` no longer blanket-rewrites everything to the SPA shell.

#### H2 — Homepage nav links to the SEO pages had no `href`
**File:** `src/app/landing/landing.component.html:27-29`
**Was:**
```html
<a class="hover:text-teal-600">Find Doctors</a>
<a class="hover:text-teal-600">How it works</a>
<a class="hover:text-teal-600">Pricing</a>
```
No `href`, no `routerLink` — inert text.
**Why it matters:** Eight well-written SEO landing pages received zero internal link equity from the highest-authority page on the site. Their only discovery route was the sitemap.
**Fixed:** real `routerLink`s in the nav, plus a footer nav linking every public page.

#### H3 — Homepage H1 carried neither the brand nor the target keywords
**File:** `src/app/landing/landing.component.html:77-84`
**Was:** visible H1 read "Health answers, always within reach." The keyword-bearing sentence was inside an `sr-only` (visually hidden) span nested in the H1.
**Why it matters:** Hidden keyword text is a pattern Google has discounted for years and is explicitly listed as something not to do. The stated business objective is ranking for the term *DoctoGuide*, and the brand appeared in no visible heading.
**Fixed:** H1 is now `DoctoGuide — AI health guide & symptom checker`; the tagline moved to its own visible line; the `sr-only` span was deleted and replaced with a real visible subhead.

#### H4 — Thin homepage content
**File:** `src/app/landing/landing.component.html`
**Was:** roughly 200–230 words of genuine prose (one H2 paragraph plus six short FAQ answers). One H1, one H2, one H3 in total.
**Why it matters:** Insufficient to compete on *AI doctor* or *symptom checker*, and health queries sit in the YMYL category where thin content is judged hardest.
**Fixed:** six new sections with a proper H2 hierarchy — What is DoctoGuide, How it works (5 steps), What it can help with, When to seek medical care, Not a replacement for a doctor, FAQ. Prerendered homepage is now **1,000+ words**.

#### H5 — Structured data contradicted robots directives
**File:** `src/index.html:60-70`
**Was:** the `WebSite` schema's `SearchAction.target` pointed at `https://doctoguide.knocdoc.in/triage?q={search_term_string}`. `/triage` is `Disallow`ed in `robots.txt` and marked `noindex,nofollow` in the route table.
**Why it matters:** Structured data directing search engines at a page they are told not to visit is a self-contradicting quality signal, and the site could not qualify for a sitelinks search box regardless.
**Fixed:** `potentialAction` removed.

#### H6 — Entity relationship to KnocDoc was not machine-readable
**File:** `src/index.html:43-92`
**Was:** three disconnected JSON-LD blocks. DoctoGuide typed as `MedicalOrganization`. No `sameAs`, no `publisher`, no parent-company relationship, no `@id` links between blocks.
**Why it matters:** Google associated the string *DoctoGuide* with a YouTube channel and two Instagram accounts because those were the only entities it could resolve. `MedicalOrganization` also overstates what the product is — it is software, not a care provider.
**Fixed:** one `@graph` — `Organization` (KnocDoc, with `sameAs`), `WebSite`, and `SoftwareApplication`, connected by `@id`, with `publisher`/`creator`/`isPartOf` edges.

#### H7 — No About, Medical Safety, or Contact page
**Why it matters:** For a YMYL health product these are the primary trust signals — who operates this, what the AI can and cannot do, how to reach a human. None existed.
**Fixed:** `/about`, `/medical-safety`, `/contact` created. No credentials, advisors, certifications, clinical validation, or partnerships are claimed, because none are documented in this project.

---

### MEDIUM

#### M1 — Sitemap was hand-maintained with hardcoded dates
**File:** `src/sitemap.xml` (deleted)
**Was:** 12 URLs with `lastmod` values hardcoded to June/July 2026 — guaranteed to go stale, and already out of step with the route table.
**Fixed:** generated at build time from the routes actually prerendered (`scripts/postbuild-seo.js`). Cannot drift from what is deployed.

#### M2 — Font loading — RETRACTED, not a defect
**File:** `src/index.html:36-40`
**Initially reported as:** five families across ~15 weight/style variants loaded via synchronous `<link rel="stylesheet">`, therefore render-blocking.

**This was wrong, and the correction matters.** That judgement was made by reading `src/index.html`, not the built output. Angular's production build has `optimization.fonts.inline` on by default: it fetches the Google Fonts CSS at build time and **replaces those `<link>` tags with an inline `<style>` block**. The evidence was in the very first request made during this audit — the live production HTML contained a large inline `@font-face` block, not a stylesheet link. There is no font-CSS round trip in the shipped page.

An async `media="print"` → `onload` swap plus a `<noscript>` fallback was briefly applied and then reverted. It solved nothing, duplicated the font URLs, and added two more build-time fetches to `fonts.googleapis.com` — which promptly caused a build failure (`Inlining of fonts failed`) on a transient network problem.

**Net:** `src/index.html` is back to plain stylesheet links, with a comment explaining why they must stay that way. The genuine remaining cost is the *font files themselves* (five families, ~15 variants from `fonts.gstatic.com`), not the CSS. Trimming weights or self-hosting subsets is real future work; it needs a design decision, since all four families are in active use.

**Also worth knowing:** the build depends on network access to `fonts.googleapis.com`. If Vercel's builder cannot reach it, the deploy fails with that same error. Setting `"fonts": { "inline": false }` under the production `optimization` block is the escape hatch if that ever bites.

#### M3 — Initial bundle over budget
**Was and still is:** `Warning: bundle initial exceeded maximum budget. Budget 500.00 kB was not met by 406.26 kB with a total of 906.26 kB.`
**Note:** raw size. Over the wire the homepage bundle is ~186 KB gzipped, which is not the bottleneck — the empty-shell problem was. Left as future work; `jspdf`/`html2canvas`/`canvg` are the obvious candidates to move behind a lazy boundary.

#### M5 — Build leftover published as a duplicate homepage
**File:** build output (`dist/AIDoctorFront/browser/index.original.html`)
**Found:** while reviewing the built artifact listing, not the source. Angular's font inliner writes the pre-inlining page to `index.original.html` and leaves it in the output directory. Deployed to a static host, that is a live, crawlable HTTP 200 URL duplicating the homepage with stale markup and the old canonical.
**Why it matters:** a duplicate homepage URL on the exact site whose headline defect was every route canonicalising to the homepage.
**Fixed:** removed in `scripts/postbuild-seo.js`. `scripts/seo-check.js` now asserts that the only HTML files at the output root are `index.html`, `404.html`, and the Google verification file.

#### M4 — No automated SEO regression protection
**Was:** one spec file in the whole project (`app.component.spec.ts`). Nothing would have caught C1, C3, or H1.
**Fixed:** `scripts/seo-check.js`, 498 assertions against the built output. Exits non-zero, so it can gate a deploy.

---

### LOW

- **L1 — `www` subdomain does not resolve.** `www.doctoguide.knocdoc.in` returns no DNS. Harmless (no duplicate-host risk) but no safety net for typed traffic. DNS-level; not fixable in this repo.
- **L2 — No `<img>` tags on the homepage.** All iconography is Material Icons ligature text, so there is no missing-alt problem — but also nothing eligible for image search.
- **L3 — Legal entity details are unfilled.** `src/app/legal/legal-config.ts` ships `[... — to be confirmed]` placeholders for entity name, address, privacy email, and grievance officer. New pages render those blocks **only when a real value is present**, so nothing publishes a placeholder — but for a YMYL health site these are meaningful trust signals and should be filled in.
- **L4 — Analytics.** Firebase Analytics is wired (`measurementId: G-EK0REP2Q0P`) and correctly guarded for SSR. No standalone GA4 tag, no Search Console link.

---

## 2. Audit checklist results

| Area | Finding |
|---|---|
| Angular version | 14.2 (NgModules, not standalone) |
| Routing | Path-based, no hash routing. Eager for public pages, lazy for `/triage`, `/partner`, `/admin`, `/owner` |
| SSR configured | Yes — Angular Universal 14 (`@nguniversal/express-engine`), full `server.ts` |
| Prerendering configured | Yes — `@nguniversal/builders:prerender`. **Was never invoked by any build script** |
| Actually deployed | Client-side only, confirmed live |
| `<head>` management | Centralised `SeoService` (`src/app/core/seo.service.ts`) driven by route `data.seo` |
| Meta/Title services | Yes, used correctly via `DOCUMENT` injection — SSR-safe |
| Unique per-route titles | Defined in the route table; only reached crawlers after JS |
| Canonicals | Implemented in `SeoService`; static fallback was homepage-only for every route |
| robots.txt | Present and correct |
| sitemap.xml | Present; hand-maintained and stale |
| Structured data | Present; disconnected and partly mistyped |
| OpenGraph / Twitter | Complete; og-image verified live (1200×630, 141 KB) |
| Accidental noindex | None found on public pages |
| Auth pages crawlable | No — correctly `noindex` and `Disallow`ed |
| Content behind JS | **Everything** |
| Crawlable `<a href>` nav | No — three homepage nav links were inert |
| Orphan pages | Eight SEO pages, sitemap-only |
| Hash routing | No |
| HTTP→HTTPS | Yes, 308 |
| Trailing slash | Consistent |
| Duplicate URLs | Yes — all routes canonicalised to `/` |
| Query-param duplicates | None generated by the app |
| 404 handling | Soft 404 (HTTP 200 homepage) |
| Image alt text | No `<img>` on the homepage; icon fonts used |
| Bundle size | 906 KB raw initial, over the 500 KB budget |
| Lazy loading | Yes, for all four private app areas |
| Fonts blocking | No — the production build inlines the font CSS into index.html |
| Third-party scripts | Firebase Analytics only, loaded from the bundle, browser-guarded |

---

## 3. What was already right

Worth stating plainly: the on-page SEO craft in this repo was above average. The problem was delivery, not authorship.

- `robots.txt` correctly allowed everything public and blocked exactly the four private areas.
- `SeoService` is a genuinely good centralised implementation — title, description, robots, canonical, OG, Twitter, and keyed JSON-LD injection, all driven from route data, all SSR-safe.
- Route-level `data.seo` blocks with distinct, well-written titles and descriptions already existed for all 12 routes.
- The `%COUNTRY%` token mechanism degrades gracefully to country-neutral copy during prerender — a thoughtful detail.
- FAQ schema on the homepage mirrors visible content, which is the correct way to use it.
- Private routes were properly `noindex` **and** `Disallow`ed — belt and braces.
- The eight existing SEO landing pages have real, non-generated content and cross-link each other.
- HTTPS, HSTS (`max-age=63072000`), and the redirect chain were all correct.

---

## 4. Priority order used for the fixes

**P0 (crawlability and indexability):** C1, C2, C3, H1 — the prerender pipeline, discovery readiness, canonicals, and HTTP status correctness.
**P1 (on-page and entity):** H2, H3, H4, H5, H6, H7 — internal linking, heading structure, homepage content, structured data, brand entity, trust pages.
**P2 (architecture and automation):** M1, M4, M5 — build-time sitemap and automated SEO checks, plus the health-topic architecture. M2 was retracted on inspection of the built output.
**P3 (long-term, not code):** backlinks, content depth, topical authority, competitive keywords. Covered as recommendations in the implementation report.

---

See **SEO_IMPLEMENTATION_REPORT.md** for what was changed, the final metadata for every route, and the Search Console steps that still require manual action.
