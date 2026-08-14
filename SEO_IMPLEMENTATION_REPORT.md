# SEO Implementation Report — DoctoGuide

**Date:** 14 August 2026
**Branch:** V1-DEV
**Companion document:** `SEO_AUDIT.md` (findings, severity, evidence)

**Verification status:** production build green, 21 routes prerendered, `scripts/seo-check.js` passing **498/501 assertions, zero warnings**. Built output smoke-tested in a browser against a local server that mirrors the Vercel routing config.

> Nothing here has been deployed, and **no page is indexed yet**. Code changes do not cause indexing. The Search Console steps in section G are required, and they are the actual unblock.

---

## A. Current SEO health

Scored against the state of the codebase, not against Google's index (which is still empty until the site is deployed and submitted).

| Category | Before | After | Note |
|---|---:|---:|---|
| Crawlability | 2 | 9 | robots and sitemap were always fine; nothing could reach them. Now generated at build and linked from real internal links. −1 until knocdoc.in links in. |
| Indexability | 1 | 9 | Every URL claimed the homepage as canonical. Now correct per route and enforced by an automated check. |
| Rendering | 0 | 10 | Empty `<app-root>` → 1,494 prerendered words on the homepage, no JS required. |
| Technical SEO | 4 | 9 | HTTPS/HSTS/redirects were already right; 404s, canonicals, and sitemap generation were not. |
| On-page SEO | 5 | 9 | Titles and descriptions were already good; H1 and content depth were not. |
| Structured data | 4 | 9 | Was disconnected and partly mistyped, with one block pointing at a disallowed URL. |
| Internal linking | 2 | 9 | Three homepage nav links had no `href`. Now every public page is one click from home. |
| Content | 3 | 8 | Homepage 200 → 1,494 words; 7 new pages, all 750+ words. |
| Performance | 6 | 6 | Unchanged. The font "fix" was retracted — the build already inlined that CSS. Initial bundle still over budget. |
| YMYL trust | 3 | 7 | About, Medical Safety, and Contact now exist. Capped at 7 because the legal entity details are still placeholders. |
| Brand / entity signals | 2 | 8 | KnocDoc relationship now machine-readable. Capped until the YouTube channel URL is confirmed and social profiles link back. |

---

## B. Problems found and fixed

Full evidence for each is in `SEO_AUDIT.md`. Summarised here with the fix.

| # | Sev | Problem | File | Fix |
|---|---|---|---|---|
| C1 | CRITICAL | `"build": "ng build"` shipped the CSR bundle; the existing Angular Universal prerender target was never invoked, so crawlers got an empty `<app-root>` | `package.json`, `angular.json` | Build now runs the prerender target and a postbuild step |
| C2 | CRITICAL | No verification tag, no crawlable inbound links, no link from the parent domain — Google had no discovery path | `src/index.html` | Verification slot added; **linking and GSC remain manual** |
| C3 | CRITICAL | Hardcoded homepage canonical served for all 12 routes | `src/index.html` | Per-route canonicals written at prerender; asserted by `seo-check.js` |
| H1 | HIGH | `{ path: '**', redirectTo: '' }` returned HTTP 200 homepage content for any unknown URL | `src/app/app-routing.module.ts` | Real `NotFoundComponent` (noindex) → `404.html`; Vercel rewrites narrowed to app routes only |
| H2 | HIGH | Homepage nav links to the SEO pages had no `href`/`routerLink` | `src/app/landing/landing.component.html` | Real `routerLink`s plus a footer nav covering all public pages |
| H3 | HIGH | H1 carried neither brand nor keywords; keywords hidden in an `sr-only` span | `src/app/landing/landing.component.html` | H1 is now `DoctoGuide — AI health guide & symptom checker`; hidden span deleted, replaced by a visible subhead |
| H4 | HIGH | ~200 words of homepage prose, one H2 total | `src/app/landing/landing.component.html` | Six H2 sections; 1,494 prerendered words |
| H5 | HIGH | `SearchAction` pointed at `/triage`, which robots.txt disallows and the router marks noindex | `src/index.html` | `potentialAction` removed |
| H6 | HIGH | Three disconnected JSON-LD blocks; DoctoGuide mistyped as `MedicalOrganization`; no `sameAs` or parent-company edge | `src/index.html` | Single `@graph` with `Organization` / `WebSite` / `SoftwareApplication` joined by `@id` |
| H7 | HIGH | No About, Medical Safety, or Contact page | new files | Three pages created |
| M1 | MEDIUM | Hand-maintained sitemap with hardcoded `lastmod` | `src/sitemap.xml` | Deleted; generated at build from the routes actually prerendered |
| M2 | ~~MEDIUM~~ | **Retracted.** Reported as render-blocking fonts, judged from `src/index.html` rather than the built output. Angular's production build inlines the font CSS into the page, so there was no round trip to remove | `src/index.html` | Change reverted; a comment now records why the plain links must stay |
| M4 | MEDIUM | No automated SEO regression protection | new file | `scripts/seo-check.js`, 501 assertions, non-zero exit |
| — | MEDIUM | **Found while working:** Angular's font inliner leaves `index.original.html` at the output root. Deployed, that is a crawlable HTTP 200 duplicate of the homepage carrying pre-inlining markup — a duplicate URL on the very site whose duplicate canonicals were the headline defect | `scripts/postbuild-seo.js` | Deleted in postbuild; `seo-check.js` now rejects any unexpected root-level HTML file |
| — | MEDIUM | **Found while working:** `.seo-prose` styles were scoped to `SeoPageLayoutComponent`, but that component renders its body through `<ng-content>`. Under emulated encapsulation, projected nodes carry the *parent's* `_ngcontent` attribute, so those rules never matched. Every heading, list, and table on the eight existing SEO pages was rendering unstyled | `seo-page-layout.component.ts`, `src/styles.scss` | Moved to the global stylesheet |

---

## C. Files changed

**Modified**
- `package.json` — `build` runs prerender + postbuild; added `build:browser` escape hatch and `seo:check`
- `angular.json` — 9 new routes in the prerender list; removed the static sitemap asset glob
- `src/index.html` — title, description, OG/Twitter titles, structured-data graph, GSC verification note
- `src/app/app-routing.module.ts` — 9 new routes, generated health-topic routes, real 404, retitled routes
- `src/app/core/seo.service.ts` — brand-first `DEFAULTS`
- `src/app/landing/landing.component.html` — H1, subhead, `<header>`, six content sections, nav and footer links
- `src/app/seo-pages/seo-page-layout.component.ts` — cross-links extended; dead scoped styles removed
- `src/app/seo-pages/seo-pages.module.ts` — declares the 7 new components
- `src/styles.scss` — `.seo-prose` styles moved here so they apply to projected content

**Added**
- `vercel.json` — build command, output dir, narrowed SPA rewrites, alias redirects, security and cache headers
- `scripts/postbuild-seo.js` — sitemap generation, `404.html`, prerender sanity check that fails the build
- `scripts/seo-check.js` — SEO acceptance checks
- `src/app/seo-pages/about-page.component.ts`
- `src/app/seo-pages/medical-safety-page.component.ts`
- `src/app/seo-pages/contact-page.component.ts`
- `src/app/seo-pages/health-topics.data.ts`
- `src/app/seo-pages/health-topics-index.component.ts`
- `src/app/seo-pages/health-topic-page.component.ts`
- `src/app/seo-pages/not-found.component.ts`
- `src/google16bbce61b7e4713d.html` — Google Search Console verification file, byte-identical to the one downloaded from GSC
- `SEO_AUDIT.md`, `SEO_IMPLEMENTATION_REPORT.md`

**Deleted**
- `src/sitemap.xml` — now generated

**Not touched.** The working tree already contained unrelated uncommitted changes to `src/app/ai-doctor/**`, `src/app/landing/landing.component.ts`, and `src/environments/*`. Those are not part of this work.

---

## D. Routes added

| Route | Purpose |
|---|---|
| `/about` | Entity/trust page. Makes "DoctoGuide → product → operated by KnocDoc" explicit in crawlable HTML |
| `/medical-safety` | YMYL trust anchor. What the AI can and cannot do, how it fails, emergency red flags |
| `/contact` | How to reach the team; data and grievance routes when configured |
| `/health-topics` | Hub page for the topic guides |
| `/health-topics/headache` | Symptom guide |
| `/health-topics/fever` | Symptom guide |
| `/health-topics/cough` | Symptom guide |
| `/health-topics/stomach-pain` | Symptom guide |
| `/404` | Real not-found page, noindex, emitted as `404.html` |

Redirects (308, in `vercel.json`) instead of new pages, so keyword variants do not become duplicates competing with the canonical page: `/ai-symptom-checker` → `/symptom-checker`, `/ai-health-guide` → `/health-guide`, `/ai-doctor-online` → `/ai-doctor`, `/safety` → `/medical-safety`.

**Deliberately not created:** separate `/ai-symptom-checker` and `/ai-health-guide` pages. `/symptom-checker` and `/health-guide` already target those queries with real content. Building both would be duplicate pages for keyword variations.

---

## E. Final metadata for every public route

Extracted from the built HTML. Every title and description is unique — enforced by `seo-check.js`.

| Route | Title | Len | Description |
|---|---|---:|---|
| `/` | DoctoGuide — AI Health Guide & Free Symptom Checker \| KnocDoc | 61 | DoctoGuide is a free AI health guide and symptom checker by KnocDoc. Describe your symptoms, understand possible explanations and urgency, and learn which specialist to see. No sign-up. |
| `/about` | About DoctoGuide — AI Health Guide by KnocDoc | 45 | DoctoGuide is a free AI health guide and symptom checker built and operated by KnocDoc. What it does, why it exists, and what it deliberately will not do. |
| `/ai-doctor` | Free AI Doctor Online — Ask Any Health Question \| DoctoGuide | 60 | Talk to a free AI doctor online. Describe your symptoms, get instant health guidance, and learn which specialist to see. No sign-up, no card. DoctoGuide by KnocDoc. |
| `/contact` | Contact DoctoGuide by KnocDoc | 29 | How to reach the team behind DoctoGuide, report a problem with the guidance, or ask about your data. Not a medical service — for emergencies call 112 or 108 in India. |
| `/disclaimer` | Medical Disclaimer \| DoctoGuide by KnocDoc | 42 | DoctoGuide is an AI health-information assistant, not a licensed physician. Read the medical disclaimer. In an emergency, call your local emergency number. |
| `/emergency-numbers` | Emergency Numbers by Country \| DoctoGuide | 41 | Official emergency and ambulance phone numbers for over 190 countries, on one free page. Bookmark before you travel. DoctoGuide by KnocDoc. |
| `/find-doctors` | Find a Doctor Near You \| DoctoGuide by KnocDoc | 46 | Find doctors near you, matched to the specialist you actually need. Free doctor search from DoctoGuide, built for India. No sign-up, no listing fees. |
| `/health-guide` | Free Online Health Guide — Symptoms & Reports \| DoctoGuide | 58 | Your free online health guide. Understand symptoms, decode lab reports, and make sense of medicines in plain language. Better than Googling. DoctoGuide by KnocDoc. |
| `/health-topics` | Health Topics — Symptom Guides \| DoctoGuide | 43 | Plain-language guides to common symptoms: what causes them, the warning signs that need urgent care, and which specialist treats them. Free from DoctoGuide by KnocDoc. |
| `/health-topics/cough` | Cough — Causes, Warning Signs & Which Doctor \| DoctoGuide | 57 | Why a cough lasts, which coughs need urgent care, what a three-week cough means, and which specialist to see. Free AI health guidance from DoctoGuide. |
| `/health-topics/fever` | Fever — When to Worry & Which Doctor to See \| DoctoGuide | 56 | What a fever actually indicates, the warning signs that need urgent care in adults and children, and which doctor to see. Free AI health guidance from DoctoGuide. |
| `/health-topics/headache` | Headache — Causes, Red Flags & Which Doctor \| DoctoGuide | 56 | Understand common headache patterns, the warning signs that need urgent care, and which specialist treats which kind of headache. Free AI guidance from DoctoGuide. |
| `/health-topics/stomach-pain` | Stomach Pain — Causes, Red Flags & Which Doctor \| DoctoGuide | 60 | What the location and character of abdominal pain suggest, the warning signs needing urgent care, and which specialist to see. Free guidance from DoctoGuide. |
| `/how-it-works` | How DoctoGuide Works — Symptoms to Specialist \| DoctoGuide | 58 | See exactly how DoctoGuide works: describe your symptoms, answer a few follow-ups, and get guidance, urgency, and the right specialist — free, no sign-up. |
| `/medical-safety` | Medical Safety & AI Limitations \| DoctoGuide | 44 | What DoctoGuide can and cannot do, how AI health guidance can be wrong, the warning signs that need emergency care, and how to use a symptom checker safely. |
| `/pricing` | DoctoGuide Pricing — Free, Always \| DoctoGuide | 46 | DoctoGuide is completely free: unlimited AI symptom checker, AI doctor, specialist matching, and doctor search. No subscription, no card, no hidden tier. |
| `/privacy` | Privacy Policy \| DoctoGuide by KnocDoc | 38 | How DoctoGuide by KnocDoc collects, uses, and protects your health information. Privacy-first AI health assistant. |
| `/symptom-checker` | Free AI Symptom Checker — Instant Guidance \| DoctoGuide | 55 | Free AI symptom checker. Describe your symptoms in plain language and get instant guidance on what could be going on, how urgent it is, and which specialist to see. |
| `/terms` | Terms of Use \| DoctoGuide by KnocDoc | 36 | Terms of use for DoctoGuide by KnocDoc, the free AI health-information assistant and symptom checker. |
| `/which-specialist-to-see` | Which Specialist Should I See? \| DoctoGuide | 43 | Not sure which doctor to see? Match your symptoms to the right specialist with our free guide and AI assistant — avoid wasted consultations. DoctoGuide by KnocDoc. |

`/404` carries `robots: noindex,follow` and is excluded from the sitemap.

---

## F. Structured data

All JSON-LD is validated as parseable by `seo-check.js` on every build.

| Schema | Where | Notes |
|---|---|---|
| `Organization` | `src/index.html`, `@id https://knocdoc.in/#organization` | KnocDoc. `sameAs` lists **only** the Instagram profile documented in `src/environments/environment.ts` |
| `WebSite` | `src/index.html`, `@id .../#website` | DoctoGuide, `publisher` → KnocDoc |
| `SoftwareApplication` | `src/index.html`, `@id .../#app` | `HealthApplication`, free offer, `MedicalAudience`, `publisher`/`creator` → KnocDoc, `isPartOf` → WebSite |
| `FAQPage` | Homepage, injected by `LandingComponent` | Mirrors the visible FAQ exactly — unchanged, still accurate |
| `BreadcrumbList` | `/about`, `/medical-safety`, `/contact`, `/health-topics`, and each topic page | Matches the visible breadcrumb trail |

**Deliberately removed:** `SearchAction` / sitelinks search box. Its only target was `/triage`, which robots.txt disallows and the router marks noindex.

**Deliberately changed:** DoctoGuide is no longer typed `MedicalOrganization`. It is software, not an organisation that provides medical care.

**Deliberately absent:** no `aggregateRating`, no `review`, no `MedicalWebPage` with a `reviewedBy`, no certifications or clinical-validation claims. None are documented in this project, and inventing them in a health context is exactly the misleading-markup case to avoid.

---

## G. Google Search Console checklist — REQUIRES MANUAL ACTION

This is the part that actually ends the blackout. Do it in this order.

**1. Verify the property — file is already in the repo**
A URL-prefix property for `https://doctoguide.knocdoc.in/` has been started, using the HTML-file method. `src/google16bbce61b7e4713d.html` is committed and copies to the site root on build (`angular.json` asset glob `google*.html`, so future verification files need no config change).

Order matters:
1. Deploy.
2. Confirm it resolves: `curl -s https://doctoguide.knocdoc.in/google16bbce61b7e4713d.html` must return `google-site-verification: google16bbce61b7e4713d.html`.
3. **Then** click VERIFY in Search Console. Clicking before the deploy fails and makes the flow more annoying than it needs to be.
4. Leave the file in place permanently — removing it un-verifies the property.

Worth adding later, not instead: a **Domain property** on `knocdoc.in` via DNS TXT covers doctoguide, doctribe, zenamaze, amnesia, and anything launched later under a single verification.

**2. Submit the sitemap**
- Sitemaps → enter `https://doctoguide.knocdoc.in/sitemap.xml` → Submit.
- Expect **20 URLs** discovered.

**3. Inspect the homepage**
- URL Inspection → `https://doctoguide.knocdoc.in/` → **Test live URL** → **View crawled page**.
- Confirm the HTML contains the H1 and the FAQ text. If it does, prerendering is live.
- The result tells you which failure mode you were in: *"Discovery — currently not indexed"* means it was never crawled; *"Crawled — currently not indexed"* means it was fetched and rejected.
- Then **Request Indexing**.

**4. Request indexing for the priority URLs**
Manually, in this order (there is a daily quota, so spend it on these first):
`/about`, `/symptom-checker`, `/ai-doctor`, `/medical-safety`, `/how-it-works`, `/which-specialist-to-see`, `/health-topics`

**5. Link from knocdoc.in — do not skip this**
Currently **nothing on the crawlable web links to DoctoGuide**. Every brand mention is on YouTube or Instagram, which mark outbound links `nofollow`. knocdoc.in is already indexed and trusted, so this is the cheapest crawl path available.
- Add a real `<a href="https://doctoguide.knocdoc.in/">` in the knocdoc.in header or footer with descriptive anchor text — *"DoctoGuide — free AI symptom checker"*, not "click here".
- Do the same from the doctribe and zenamaze footers.

**6. Complete the entity loop**
- Put `https://doctoguide.knocdoc.in` in the YouTube channel's official-website field and the Instagram bio link.
- Send me the verified YouTube channel URL and I will add it to the `sameAs` array. It is deliberately absent right now because it is not documented anywhere in this repository.

**7. Bing Webmaster Tools**
Sign in and import from Search Console — it is one click, and it also feeds ChatGPT's search results.

**8. Monitor**
- Days 2–5: `site:doctoguide.knocdoc.in` should start returning the homepage.
- Weeks 1–2: Pages report should show 18–20 of 20 indexed. Investigate anything marked *Excluded*.
- Weeks 2–4: searching `DoctoGuide` should put your site at position 1, above the YouTube and Instagram results.
- Months 2–3: Performance → Queries should show non-branded impressions.

---

## H. Status

### DONE (verified in the build)
- Prerendering ships by default; 21 routes emit real HTML with no JS required.
- Homepage: 1,494 prerendered words, one H1, six H2s. `/about` 985, `/medical-safety` 1,252, `/health-topics/headache` 1,371, `/contact` 766.
- Correct, unique canonical on every route — asserted every build.
- Unique title and description on all 20 public routes — asserted every build.
- Only three HTML files sit at the output root: `index.html`, `404.html`, and the Google verification file. `index.original.html` is stripped.
- Real 404: unknown URLs serve `404.html`; `/triage`, `/partner`, `/admin`, `/owner` still resolve through the SPA. Verified against a local server mirroring the Vercel config.
- `sitemap.xml` generated from what was actually built; excludes `/404` and all private routes.
- Connected structured-data graph; contradictory `SearchAction` removed.
- Nine new routes, all internally linked from the homepage and cross-linked to each other.
- `scripts/seo-check.js` — 501 assertions, zero failures, zero warnings.
- The build now **fails** if the prerendered homepage has no `<h1>`.
- Fixed the pre-existing bug that left all eight existing SEO pages' prose unstyled — headings, lists, tables, and `<details>` blocks now render correctly on all fifteen content pages.
- App still works. Verified in Chrome against the built output: the homepage renders and hydrates, IP-based country detection resolves, in-app navigation updates the document title per route, and prose styling applies. Console output over a full page load and a navigation contained only `[CountryService]` info logs — no errors, no warnings, no Angular runtime messages.

### REQUIRES MANUAL ACTION (cannot be done from this repository)
1. **Create the Search Console property and submit the sitemap** — section G. Nothing gets indexed without this.
2. **Add a link from knocdoc.in to doctoguide.knocdoc.in** — different repository.
3. **Fill in `src/app/legal/legal-config.ts`.** Entity name, registered address, hosting location, retention periods, privacy email, grievance officer, and jurisdiction are all still `[... — to be confirmed]`. The new pages hide those blocks rather than publish a placeholder, but for a YMYL health site these are real trust signals and their absence caps that score.
4. **Confirm the YouTube channel URL** so it can be added to `sameAs`.
5. **Add `https://doctoguide.knocdoc.in` to the YouTube and Instagram profile link fields.**
6. **Check the Vercel dashboard.** `vercel.json` now sets the build command and output directory explicitly. If the dashboard has a conflicting Output Directory, the file wins — confirm the first deploy succeeds and that `curl -s https://doctoguide.knocdoc.in/pricing | grep canonical` returns the `/pricing` canonical, not `/`.
7. **Decide on `www`.** `www.doctoguide.knocdoc.in` does not resolve. Harmless, but a CNAME plus redirect would catch typed traffic.

### FUTURE SEO WORK (P3, not blocking)
- **Backlinks.** The single biggest remaining constraint. Product Hunt, Indian startup directories, health-tech listings, AI-tool directories, and genuine PR around KnocDoc.
- **Content depth.** The health-topic template supports more topics; add them only where there is content of the same depth. Do not generate them from a keyword list.
- **YMYL trust.** If real medical reviewers are ever engaged, expose their credentials and add `reviewedBy`. Do not fabricate this — it is worse than having nothing.
- **Bundle size.** 906 KB raw initial, over the 500 KB budget. `jspdf`, `html2canvas`, and `canvg` are the obvious candidates to move behind a lazy boundary.
- **Font files.** The CSS is already inlined at build time, so the remaining cost is the font *files* — five families, ~15 variants from `fonts.gstatic.com`. Trimming weights or self-hosting subsets needs a design decision, since all four families are in use.
- **Build-time font dependency.** The production build fetches `fonts.googleapis.com` to inline that CSS, and fails with `Inlining of fonts failed` if it cannot. If a Vercel deploy ever hits this, set `"fonts": { "inline": false }` under the production `optimization` block.
- **Head terms.** `AI doctor` and `symptom checker` are held by Practo, Mayo Clinic, and WebMD. Realistic near-term wins are the branded query and India-specific long tail — regional-language support, 112/108 guidance, specialist-selection norms in Indian healthcare.

---

## Commands

```bash
npm run build         # prerender + sitemap + 404.html + sanity check
npm run seo:check     # 498 SEO assertions against dist/
npm run build:browser # CSR-only build, kept as an escape hatch
```
