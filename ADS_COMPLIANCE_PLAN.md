# DoctoGuide — Google Ads "sensitive health category" plan

**Date:** 20 August 2026
**Problem:** the DoctoGuide campaign is being limited / flagged under Google's
personalised-advertising policy for health, a **sensitive interest category**.
**Cause (corrected after checking git history):** *not* the commit named "seo changes"
(`743494a`, 26 Jul) — that one never touched the homepage, it only fixed canonical/OG domain
URLs and added the new SEO pages. And "AI Doctor" was already in `og:title` / `twitter:title`
at `8502be8` (21 Jun), well before it.

The homepage change is **`85be4fa` "doctoguide improvement", 14 Aug**, which took
`landing.component.html` from 260 to 366 lines. Before it, the H1 was just the tagline
"Health answers, always within reach" and the page carried no condition prose. After it, the
page gained "What is DoctoGuide?", "How DoctoGuide works", "What DoctoGuide can help with"
(lab reports, medicine labels), a **"When you should seek medical care"** paragraph naming
~8 conditions plus *"thoughts of harming yourself"* (mental health — explicitly sensitive
under the policy), a 6-question clinical FAQ, and FAQPage JSON-LD.

Note the "What brings you in?" input box and the condition-named placeholders were present
*before* that commit, while the ad was serving fine — so the input box alone is unlikely to
be the trigger; the 106-line condition block is the better suspect. This is timing
correlation, not proof: the campaign is also very likely using audience types that are not
allowed once a page is classified as health (see §3.4), which would limit it regardless.

---

## 1. What the policy actually does (read this before changing anything)

The policy you pasted is **"Restricted targeting in personalised advertising"**. It is *not*
a disapproval policy. Once Google classifies your creative or landing page as the health
sensitive interest category, the ad **keeps running** — but these targeting types stop
working:

| Not allowed with a health landing page | Still allowed |
|---|---|
| Customer Match | In-market segments |
| Your data segments (remarketing lists) | Affinity segments |
| Lookalike / similar segments | Demographics + detailed demographics |
| Audience expansion / optimised targeting | Life events |
| Custom segments — **serve only on Display, to non-sensitive audiences or contextually**; on any other campaign type they **do not serve at all** | Location targeting |

Two consequences that matter here:

1. **A landing-page rewrite alone will not clear a "Limited" status** if the campaign is
   still attached to Customer Match, a remarketing list, a lookalike, or has audience
   expansion / optimised targeting switched on. Those must be removed regardless.
2. **A custom segment + sensitive landing page on a Search or Performance Max campaign =
   zero serving.** If the campaign uses custom segments, that is very probably the actual
   cause of "limited" rather than any wording.

Also: **users under 18 are never eligible for personalised ads**, so keep age targeting at
18+ — which also matches the app's own adults-only gate (see `COMPLIANCE_AUDIT.md`, F-2).

**Honest limit:** DoctoGuide is a health product. No wording makes it a non-health
advertiser. What the rewrite *can* do is stop the landing page from carrying **personal
health content** signals — content about a specific person's condition, symptoms,
treatments, or medicines — which is the narrower thing this policy defines. That's the
difference between "healthcare advertiser" (fine) and "personal health content" (restricted).

---

## 2. What on the current site triggers the classification

Audited against the policy's own definition of personal health content.

| Signal | Where | Why it triggers |
|---|---|---|
| Second-person symptom framing — "What brings you in?", "describe how you feel", "your symptoms" | `landing.component.html` hero, entry box, subhead | The clearest personal-health-condition signal there is: the page invites the visitor to disclose a condition. |
| Free-text symptom input on the landing page | `landing.component.html` entry box | Same, plus it makes the page look like a health-data collection surface. |
| Rotating placeholder examples naming conditions — sore throat + fever, "pet me dard", chest pain, rash, headache, बुखार | `landing.component.ts` `useCases[]` | Named symptoms and body parts, including intimate/abdominal. |
| "AI doctor" / "symptom checker" in the H1, title, meta description, and JSON-LD | `index.html`, route `data.seo`, `landing.component.html` | Reads as a diagnostic service, not an information tool. |
| Enumerated emergency warning signs — chest pain, bleeding, seizure, weakness, self-harm | landing "When you should seek medical care" | Condition names, plus **mental health** ("thoughts of harming yourself"), which is explicitly sensitive. |
| Lab reports / medicines copy — "understand a lab report or a medicine label" | landing, `health-guide` page | Products and medications to manage a condition. |
| Health-topic pages: headache, fever, cough, stomach pain | `health-topics.data.ts` + routes | Condition-level content; bowel/abdominal content is explicitly called out in the policy. |
| FAQPage JSON-LD with clinical questions | `landing.component.ts` `faqSchema()` | Machine-readable "this page is about your health condition". |

None of this is wrong for **SEO** — it is why the site ranks. It is wrong for the **ad
landing page**. So the fix is separation, not deletion.

---

## 3. The plan

### 3.1 Strategy: separate the ad landing page from the SEO homepage

Do **not** strip the homepage. It is the organic asset, the SEO work is recent (see
`SEO_AUDIT.md` / `SEO_IMPLEMENTATION_REPORT.md`), and the site is still fighting to get
indexed at all. Gutting its keywords to please Ads trades a permanent asset for a
temporary campaign fix.

Instead: a purpose-built paid-traffic landing page that describes the genuinely
non-personal-health half of the product — **working out which speciality to book, and
finding a doctor nearby**. The symptom-led surface stays exactly one click away, in
`/triage`, behind the CTA.

This is not a cloak. The page makes no claim the product doesn't deliver, carries the same
disclaimers, and links to the same legal pages. It just doesn't ask the visitor to disclose
a condition on the page Google crawls for classification.

### 3.2 Shipped in this change

| Item | File |
|---|---|
| New ad landing page at **`/start`** | `src/app/landing/ad-landing.component.ts` / `.html` |
| Route with `robots: noindex,nofollow` and its own non-clinical title/description | `src/app/app-routing.module.ts` |
| Declared in the app module | `src/app/app.module.ts` |
| Prerendered, so AdsBot fetches real HTML rather than an empty SPA shell | `angular.json` → `prerender.routes` |
| Excluded from `sitemap.xml` | `scripts/postbuild-seo.js` (`EXCLUDED`) |
| Asserted absent from the sitemap by the SEO check | `scripts/seo-check.js` |
| CTA click analytics (`ad_lp_cta_click`, source hero/mid/foot) | `ad-landing.component.ts` |

`robots.txt` is deliberately **not** changed. A `Disallow: /start` would stop Googlebot
reading the `noindex` tag, and it would do nothing useful anyway — AdsBot-Google ignores
`User-agent: *` rules. The meta `noindex` is the correct tool.

### 3.3 The word list the ad page obeys

Banned on `/start` (and on any future ad landing page or ad creative):

- Any condition, disease, or symptom name, **in any language** — fever, cough, headache,
  pain, rash, बुखार, "pet me dard", etc.
- Second-person symptom framing: "your symptoms", "how you feel", "what's wrong",
  "what brings you in".
- Medicines, prescriptions, dosages, lab reports, treatments, therapies, procedures.
- Mental health, sexual health, fertility/pregnancy, addiction, self-harm.
- Chronic conditions and their management; disability; carer-of framing.
- "Diagnosis", "diagnose", "triage", "AI doctor", "symptom checker".
- Free-text field *wording* that invites a health complaint. `/start` does carry a hero
  entry box with a rotating placeholder, but every string in it asks which **kind of
  doctor** the visitor wants, never what is wrong with them: label "What kind of doctor
  are you looking for?", aria-label "Tell us what kind of doctor you are looking for",
  and directory-framed placeholders (`AdLandingComponent.useCases`). The homepage's
  example queries — antacids, sore throat, "pet me dard", chest pain, बुखार, rash,
  headache — must never be copied in; they render into the DOM and are exactly the
  signal this page avoids.
- Framing the product as a triage or preparation aid rather than a **directory**. The page
  copy says it helps you *narrow down which type of doctor to book with* and *explore your
  options* — not that it works out what fits your situation or gets you ready for a
  consultation. "A directory tool, not medical advice." sits above the fold for the same
  reason.
- FAQ/JSON-LD entries phrased as clinical questions.

Kept, because safety and the medical disclaimer require them:

- "not a licensed physician", "does not provide medical advice, diagnosis, treatment, or
  prescriptions" — these are *negations*, and they are what keeps the page compliant with
  Google's healthcare policy and with ASCI.
- One emergency line, **without** the enumerated warning signs. The full warning-sign list
  stays on `/medical-safety`, which paid traffic does not land on.

### 3.4 Campaign-side changes — do these in the Ads UI, they are not optional

The landing page cannot fix any of these:

1. **Remove Customer Match lists** from the campaign and ad group. Do not upload any
   customer list for this product.
2. **Remove "Your data" / remarketing segments** and any **lookalike / similar** segments.
3. **Turn off audience expansion**; in Search, turn off **optimised targeting**.
4. **Remove custom segments** unless the campaign is Display. On Search or Performance Max
   a custom segment plus a sensitive landing page means the ads do not serve.
5. If running **Performance Max**: strip audience signals built from your data (customer
   lists, site visitors). Better still, run **Search with keywords** first — it has the
   fewest personalised-targeting dependencies.
6. **Age targeting 18+**; exclude under-18 wherever the campaign type exposes it.
7. Re-check **Site-wide tags / enhanced conversions**: do not send customer data for this
   product.
8. Re-submit for review after the final URL is switched. Status changes are not instant.

### 3.5 Keywords and ad copy

Bid on **navigation and utility intent**, not condition intent. Condition keywords
("fever treatment", "chest pain doctor") re-attach the sensitive classification to the ad
itself even if the landing page is clean, and they compete with the SEO pages you already
rank for organically.

Good keyword themes: `which doctor should i see`, `which specialist for`, `find doctor
near me`, `book doctor appointment`, `doctor near me open now`, `general physician near
me`, `free doctor consultation guide`.

Headlines (30 chars max — all fit):

- `Know Which Doctor To See`
- `Find The Right Specialist`
- `Free — No Sign-Up Needed`
- `Doctors Near You, Fast`
- `Book The Right Doctor`
- `Stop Guessing Who To Book`
- `Answers In Any Language`
- `By KnocDoc`

Descriptions (90 chars max):

- `Answer a few questions and get pointed to the right speciality. Free, no sign-up.`
- `Find doctors near you with hours and contact details. Book directly, no fees.`
- `Works in English, Hindi or Hinglish. Takes about two minutes.`
- `An information tool from KnocDoc — not a doctor and not a consultation.`

Creative rules: no images of patients, medicines, body parts, or clinical procedures. Brand
mark, UI screenshots of the *specialist/doctor-list* screen only — never a screenshot of a
symptom conversation.

### 3.6 Follow-ups not done in this change

| Item | Why it matters | Owner |
|---|---|---|
| `assets/og-image.png` still reads "AI Health Guide & Symptom Checker" | It is the `og:image` on `/start` too. Ship a neutral variant (`og-start.png`) and set `seo.image` on the `/start` route. | design |
| Switch the campaign's **Final URL** to `https://doctoguide.knocdoc.in/start` | Nothing above takes effect until this happens. | you, in the Ads UI |
| Consider a second variant `/start-b` for a doctor-directory-first angle | Lets you A/B without touching the SEO homepage. | later |
| The `/triage` destination still asks for symptoms | Unavoidable — it is the product. Kept behind the CTA, `noindex`, and `Disallow: /triage` in robots.txt. | accepted risk |

---

## 3A. Second pass — Healthcare & Misrepresentation policies (site-wide)

The §3 work isolated paid traffic on `/start`. This pass fixes the **whole site**, because
the Healthcare and Misrepresentation policies judge the advertised business, not just the
one URL the ad points at.

### Terminology: "AI Doctor" is gone as a self-description

"AI doctor" implies a licensed practitioner. Every user-facing occurrence now reads
**"AI health assistant"**, with informational-tool framing attached:

| File | Was | Now |
|---|---|---|
| `index.html` title / og / twitter | "AI Health Guide & Free Symptom Checker" | "AI Health Assistant & Free Symptom Checker", descriptions end "not medical advice" |
| `app-routing.module.ts` `/` , `/ai-doctor`, `/pricing`, `/about`, 404 | "AI health guide", "Free AI Doctor Online" | "AI health assistant", "Free AI Health Assistant Online" |
| `core/seo.service.ts` DEFAULTS | same | same |
| `manifest.webmanifest` | "Free AI doctor & symptom checker" | "Free AI health assistant & symptom checker … Not medical advice." |
| `landing.component.html` H1 | "AI health guide & symptom checker" | "AI health assistant & symptom checker" |
| `landing.component.html` subhead | "A free AI doctor and symptom checker" | "A free AI health assistant and symptom guide … An informational tool, not a licensed medical practitioner." |
| landing FAQ + FAQPage JSON-LD | "Is this an AI doctor or real medical advice?" | "Is DoctoGuide medical advice?" |
| `seo-pages/ai-doctor-page.component.ts` | H1 "Your free AI doctor", 12 in-body mentions, `MedicalWebPage.name` | rewritten to "AI health assistant" throughout |
| `seo-page-layout.component.ts`, `health-guide`, `how-it-works`, `pricing`, `about`, `not-found` | "AI Doctor" link label + body mentions | "AI Health Assistant" |
| `triage-shell.component.ts` greeting | "Hi! I'm your AI health guide." | "Hi! I'm your AI health assistant — an informational guide, not a doctor." |

**The `/ai-doctor` URL is kept.** It is indexed and internally linked; changing the path
would 404 those links and buy no compliance benefit, since the policy is about what the
page *claims*, not what it is filed under.

**"Symptom checker" is kept too.** It is an accurate, standard category name and claims no
practitioner status — unlike "AI doctor". Dropping it would have cost the site's strongest
organic term for nothing.

*SEO cost, stated honestly:* `/ai-doctor` was written to rank for the query "AI doctor" and
no longer targets that phrase. Given the site is still fighting to get indexed at all (see
`SEO_AUDIT.md`), that is a real loss. It is the right trade when the ad account is the
constraint, and one clarifying sentence ("sometimes called an AI doctor — DoctoGuide is
not one") could be re-added later if the keyword matters more than the last few percent of
misrepresentation risk.

### Upfront disclaimer at the point of entry

Directly beneath the "What brings you in?" input container on `/` (and beneath the primary
CTA on `/start`):

> For informational and educational guidance only. Not medical advice or a formal
> diagnosis. In an emergency, please contact your local emergency services.

Placed *above* the multilingual hint and every other supporting line, so the visitor reads
it before typing.

### Footer: ownership and support contact

Every public surface — landing footer, `/start` footer, and the shared
`seo-page-layout` footer used by all 15 SEO pages — now carries:

> DoctoGuide is operated by **KnocDoc**. Support: support@knocdoc.in · knocdoc.in

`Contact` was also added to the footer link row alongside Privacy Policy, Terms of Use, and
Medical Disclaimer. All four routes exist in `app-routing.module.ts` and are prerendered.

### Emergency / Geo-IP fallback — two real bugs fixed

`CountryService` gained `inCountry`, `emergencyNumbersText`, and `emergencySentence`, and
every emergency string in the app now reads from them instead of stitching raw numbers into
markup. That fixes:

1. **Duplicate numbers.** 84 of the 204 entries in `countries.json` use the same value for
   `all` and `ambulance` (US 911, UK 999, …). The old
   `call {{all}} or {{ambulance}}` markup rendered **"call 911 or 911"** for those
   visitors, and the triage emergency card rendered **two identical call buttons**.
   `emergencyNumbersText` collapses them; the card's buttons are now one per distinct
   number.
2. **Unsafe fallback while the country is unknown.** `emergencyNumbers` is seeded with the
   `112` environment default, so before IP detection resolved — which includes *every
   prerendered page*, where detection never runs — visitors were told to dial 112 wherever
   they were. Now the unknown case reads **"call your local emergency services
   (112 / 911)"**.
3. **Grammar.** `" in United States"` → `" in the United States"`, via a name pattern
   covering the 19 country names that take a definite article.

Rendered forms:

| Country state | Text |
|---|---|
| Unknown (prerender, pre-detection) | In a medical emergency, call your local emergency services (112 / 911) immediately. |
| India | In a medical emergency in India, call 112 or 108 (ambulance) immediately. |
| United States | In a medical emergency in the United States, call 911 immediately. |

Call sites updated: landing (3), `/start` (1), `triage-shell` banner + emergency card +
call buttons, `disclaimer.component.ts`, `terms.component.ts`. The now-redundant
`*ngIf="countryName"` / `*ngIf="!countryName"` paragraph pairs in the legal pages and the
triage shell were collapsed into single paragraphs.

---

## 4. Residual risk — stated plainly

- Google may still classify the **account or the product** as health, based on the domain
  as a whole. If that happens, the targeting restrictions apply no matter what `/start`
  says; the campaign-side changes in §3.4 are then the entire fix.
- "Limited" can also come from a **different** policy — Healthcare and medicines — which
  restricts what health advertisers may say and, in some countries, requires certification.
  If the status text mentions healthcare/medicines rather than personalised advertising,
  §3.4 is not the answer; re-read the specific policy named in the UI and check whether the
  ad text implies diagnosis or treatment.
- Do not appeal by claiming DoctoGuide is not a health product. It is. The accurate
  position is: *an information and navigation tool that does not collect or serve personal
  health condition content on its advertised landing page.*
